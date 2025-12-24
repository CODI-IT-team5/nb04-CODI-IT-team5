/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, PrismaClient } from '@prisma/client';
import type { Operation } from '@prisma/client/runtime/binary';

import logger from './logger.js';

export type ExtendedPrismaClient = typeof prisma;
export type ExtendedTransactionClient = Parameters<Parameters<ExtendedPrismaClient['$transaction']>[0]>[0];

export type ExtendedDeleteArgs<T> = T & { reason?: string };

const SOFT_DELETE_MODELS = new Set([
  'User',
  'Device',
  'RefreshToken',
  'Store',
  'Product',
  'Order',
  'OrderItem',
  'Payment',
]);

const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: any;
          operation: Operation;
          args: any;
          query: any;
        }) {
          logger.debug(
            {
              target: 'prisma',
              event: 'query',
              model,
              operation,
              args,
              query,
            },
            'prisma query 확장',
          );
          if (!SOFT_DELETE_MODELS.has(model)) return query(args);

          const modelObject = (client as any)[model];

          if (['findMany', 'findFirst', 'findUnique', 'count', 'groupBy', 'aggregate'].includes(operation)) {
            if (operation === 'findUnique') {
              // Prisma's findUnique doesn't support additional filters, so switch to findFirst
              return modelObject.findFirst(args);
            }

            args ||= {};
            args.where ||= {};
            args.where.deletedAt = null;
          } else if (['update', 'updateMany', 'upsert'].includes(operation)) {
            args ||= {};
            args.where ||= {};
            args.where.deletedAt = null;
          } else if (['delete', 'deleteMany'].includes(operation)) {
            if (operation === 'delete') {
              logger.debug(
                {
                  target: 'prisma',
                  event: 'soft-delete',
                  model,
                  where: args.where,
                  reason: args.reason,
                },
                'Soft delete 실행 (delete -> update)',
              );

              return modelObject.update({
                where: args.where,
                data: {
                  deletedAt: new Date(),
                  ...(args.reason ? { reason: args.reason } : {}),
                },
              });
            }
          } else {
            logger.debug(`SoftDeleteExtension: Operation '${operation}' 지원 안 됨`);
          }
          return query(args);
        },
      },
    },
  });
});

const prisma = new PrismaClient().$extends(softDeleteExtension);

export default prisma;
