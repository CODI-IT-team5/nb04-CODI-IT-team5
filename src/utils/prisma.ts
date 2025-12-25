import { Prisma, PrismaClient } from '@prisma/client';
import type { Operation } from '@prisma/client/runtime/binary';

import logger from './logger.js';

/**
 * Soft delete 기능이 포함된 확장 Prisma 클라이언트
 */
export type ExtendedPrismaClient = typeof prisma;

/**
 * prisma.$transaction()에서 사용할 트랜잭션 클라이언트 타입
 */
export type ExtendedTransactionClient = Parameters<Parameters<ExtendedPrismaClient['$transaction']>[0]>[0];

/**
 * 삭제 사유를 포함하는 확장 delete 인자
 */
export type ExtendedDeleteArgs<T> = T & { reason?: string };

/**
 * Soft delete 기능을 지원하는 모델 목록
 */
const SOFT_DELETE_MODELS = [
  'User',
  'Device',
  'RefreshToken',
  'Store',
  'Product',
  'Order',
  'OrderItem',
  'Payment',
] as const;

/**
 * Soft delete를 지원하는 모델 이름 타입
 */
type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

const READ_OPERATIONS: readonly Operation[] = [
  'findMany',
  'findFirst',
  'findUnique',
  'count',
  'groupBy',
  'aggregate',
] as const;
const UPDATE_OPERATIONS: readonly Operation[] = ['update', 'updateMany', 'upsert'] as const;
const DELETE_OPERATIONS: readonly Operation[] = ['delete', 'deleteMany'] as const;

/**
 * 모델이 soft delete를 지원하는지 확인하는 타입 가드
 */
function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

/**
 * 쿼리 인자에 deletedAt: null 필터 추가
 */
function addSoftDeleteFilter(args: Record<string, unknown>): void {
  if (!args.where || typeof args.where !== 'object') {
    args.where = {};
  }
  (args.where as Record<string, unknown>).deletedAt = null;
}

/**
 * Soft delete 필터를 추가하여 읽기 작업 처리
 */
function handleReadOperation(
  operation: Operation,
  args: Record<string, unknown>,
  client: PrismaClient,
  model: string,
  query: (args: Record<string, unknown>) => Promise<unknown>,
): Promise<unknown> {
  if (operation === 'findUnique') {
    // findUnique는 추가 필터를 지원하지 않으므로 findFirst로 전환
    logger.debug(
      { target: 'prisma', event: 'findUnique-redirect', model },
      'Soft delete 지원을 위해 findUnique를 findFirst로 리다이렉트',
    );
    const modelDelegate = (client as unknown as Record<string, Record<string, unknown>>)[model];
    const findFirst = modelDelegate?.['findFirst'] as ((args: Record<string, unknown>) => Promise<unknown>) | undefined;

    if (typeof findFirst === 'function') {
      addSoftDeleteFilter(args);
      return findFirst(args);
    }
  }

  addSoftDeleteFilter(args);
  return query(args);
}

/**
 * Soft delete 필터를 추가하여 업데이트 작업 처리
 */
function handleUpdateOperation(
  args: Record<string, unknown>,
  query: (args: Record<string, unknown>) => Promise<unknown>,
): Promise<unknown> {
  addSoftDeleteFilter(args);
  return query(args);
}

/**
 * Delete 작업을 soft delete(update)로 변환하여 처리
 */
function handleDeleteOperation(
  operation: Operation,
  args: ExtendedDeleteArgs<Record<string, unknown>>,
  client: PrismaClient,
  model: string,
): Promise<unknown> {
  if (operation === 'delete') {
    logger.debug(
      {
        target: 'prisma',
        event: 'soft-delete',
        model,
        where: args.where,
        reason: args.reason,
      },
      'Delete를 soft delete로 변환 (deletedAt을 설정하는 update)',
    );

    const modelDelegate = (client as unknown as Record<string, Record<string, unknown>>)[model];
    const update = modelDelegate?.['update'] as ((args: Record<string, unknown>) => Promise<unknown>) | undefined;

    if (typeof update === 'function') {
      const updateArgs: Record<string, unknown> = {
        where: args.where,
        data: {
          deletedAt: new Date(),
          ...(args.reason ? { reason: args.reason } : {}),
        },
      };
      return update(updateArgs);
    }
  }

  // deleteMany는 현재 soft delete에서 지원되지 않음
  logger.warn({ target: 'prisma', operation, model }, 'Soft-delete 모델에서 deleteMany 작업 - 필요시 구현 고려');

  throw new Error(`작업 '${operation}'은 soft delete 모델에서 지원되지 않습니다. 'delete'를 사용하세요.`);
}

/**
 * Prisma 클라이언트용 Soft delete 확장
 * Soft delete된 레코드를 자동으로 필터링하고 delete 작업을 update로 변환
 */
const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          logger.debug(
            {
              target: 'prisma',
              event: 'query',
              model,
              operation,
            },
            'Soft delete 확장에서 Prisma 쿼리 인터셉트',
          );

          // Soft delete를 지원하지 않는 모델은 확장 건너뛰기
          if (!isSoftDeleteModel(model)) {
            return query(args);
          }

          // 읽기 작업 처리
          if (READ_OPERATIONS.includes(operation)) {
            return handleReadOperation(operation, args, client as PrismaClient, model, query);
          }

          // 업데이트 작업 처리
          if (UPDATE_OPERATIONS.includes(operation)) {
            return handleUpdateOperation(args, query);
          }

          // 삭제 작업 처리
          if (DELETE_OPERATIONS.includes(operation)) {
            return handleDeleteOperation(operation, args, client as PrismaClient, model);
          }

          // 지원하지 않는 작업 - 그대로 통과
          logger.debug({ target: 'prisma', operation, model }, 'Soft delete 확장에서 처리하지 않는 작업, 그대로 통과');
          return query(args);
        },
      },
    },
  });
});

const prisma = new PrismaClient().$extends(softDeleteExtension);

export default prisma;
