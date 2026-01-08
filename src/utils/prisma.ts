import { Prisma, PrismaClient } from '@prisma/client';
import type { Operation } from '@prisma/client/runtime/binary';

import { logger } from './logger.js';

export type ExtendedPrismaClient = typeof prisma;
export type ExtendedTransactionClient = Parameters<Parameters<ExtendedPrismaClient['$transaction']>[0]>[0];
export type ExtendedDeleteArgs<T> = T & { reason?: string };

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

function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

function addSoftDeleteFilter(args: Record<string, unknown>): void {
  if (!args.where || typeof args.where !== 'object') {
    args.where = {};
  }
  (args.where as Record<string, unknown>).deletedAt = null;
}

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
      if (
        value !== Prisma.skip &&
        !(
          typeof value === 'object' &&
          value !== null &&
          Object.keys(value).length === 0 &&
          value.constructor === Object
        )
      ) {
        cleanedData[key] = value;
      }
    }

    args.data = cleanedData;
  }

  return query(args);
}

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

  logger.error(
    { target: 'prisma', operation, model },
    'Soft delete 변환 실패: 모델 delegate 또는 메서드를 찾을 수 없음',
  );

  throw new Error(`${model} 모델에서 ${operation} 작업을 soft delete로 변환할 수 없습니다.`);
}

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

          if (!isSoftDeleteModel(model)) {
            return query(args);
          }

          if (READ_OPERATIONS.includes(operation)) {
            return handleReadOperation(operation, args, client as PrismaClient, model, query);
          }

          if (UPDATE_OPERATIONS.includes(operation)) {
            return handleUpdateOperation(args, query);
          }

          if (DELETE_OPERATIONS.includes(operation)) {
            return handleDeleteOperation(operation, args, client as PrismaClient, model);
          }

          logger.debug({ target: 'prisma', operation, model }, 'Soft delete 확장에서 처리하지 않는 작업, 그대로 통과');
          return query(args);
        },
      },
    },
  });
});

const prisma = new PrismaClient().$extends(softDeleteExtension);

export default prisma;
