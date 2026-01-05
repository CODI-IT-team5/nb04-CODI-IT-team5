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

  // data 객체에서 Prisma.skip 값을 제거
  if (args.data && typeof args.data === 'object') {
    const data = args.data as Record<string, unknown>;
    const cleanedData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Prisma.skip은 symbol이므로 typeof로 체크하거나, 빈 객체가 된 경우를 필터링
      if (value !== Prisma.skip && !(typeof value === 'object' && value !== null && Object.keys(value).length === 0 && value.constructor === Object)) {
        cleanedData[key] = value;
      }
    }

    args.data = cleanedData;
  }

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
  const modelDelegate = (client as unknown as Record<string, Record<string, unknown>>)[model];
  const deletedAtData = {
    deletedAt: new Date(),
    ...(args.reason ? { reason: args.reason } : {}),
  };

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

    const update = modelDelegate?.['update'] as ((args: Record<string, unknown>) => Promise<unknown>) | undefined;

    if (typeof update === 'function') {
      return update({
        where: args.where,
        data: deletedAtData,
      });
    }
  } else if (operation === 'deleteMany') {
    logger.debug(
      {
        target: 'prisma',
        event: 'soft-delete-many',
        model,
        where: args.where,
        reason: args.reason,
      },
      'DeleteMany를 soft delete로 변환 (deletedAt을 설정하는 updateMany)',
    );

    const updateMany = modelDelegate?.['updateMany'] as
      | ((args: Record<string, unknown>) => Promise<unknown>)
      | undefined;

    if (typeof updateMany === 'function') {
      return updateMany({
        where: args.where,
        data: deletedAtData,
      });
    }
  }

  // 이 지점에 도달하는 경우: modelDelegate가 없거나 update/updateMany 메서드를 찾을 수 없는 경우
  // 정상적인 상황에서는 발생하지 않지만, 방어적으로 에러를 로깅하고 원래 쿼리를 실행
  logger.error(
    { target: 'prisma', operation, model },
    'Soft delete 변환 실패: 모델 delegate 또는 메서드를 찾을 수 없음',
  );

  throw new Error(`${model} 모델에서 ${operation} 작업을 soft delete로 변환할 수 없습니다.`);
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
