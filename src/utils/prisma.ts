import { DeletedTokenReason, PrismaClient } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';

const basePrisma = new PrismaClient()
  .$extends({
    name: 'skipRemover',
    query: {
      $allModels: {
        async update({ args, query }) {
          if (args.data) {
            args.data = removeSkipFields(args.data);
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (args.data) {
            args.data = removeSkipFields(args.data);
          }
          return query(args);
        },
      },
    },
  })
  .$extends(
    createSoftDeleteExtension({
      models: {
        User: true,
        Device: true,
        RefreshToken: true,
        Store: true,
        Product: true,
        Order: true,
        OrderItem: true,
        Payment: true,
      },
      defaultConfig: {
        field: 'deletedAt',
        createValue: (deleted) => {
          if (deleted) return new Date();
          return null;
        },
      },
    }),
  );

// 리프레시 토큰 소프트삭제 확장
const prisma = basePrisma.$extends({
  model: {
    refreshToken: {
      async deleteWithReason(args: { where: { jti: string }; reason: DeletedTokenReason }) {
        return await basePrisma.refreshToken.update({
          where: args.where,
          data: {
            reason: args.reason,
            deletedAt: new Date(),
          },
        });
      },
    },
  },
});

/**
 * update, updateMany에서 빈 객체 제거
 *
 * soft delete 확장 설치 없을 때는
 * schema.prisma에서 `previewFeatures = ["strictUndefinedChecks"]` 설정 후에
 * `?? Prisma.skip` 로 사용하면 빈 객체는 업데이트 안 하고 스킵되는데
 * 확장 사용시 에러 발생
 * TODO: 추후 더 자세한 원인 분석과 해결 방법 찾아봐야함
 */
const removeSkipFields = <T extends Record<string, unknown>>(data: T): T => {
  if (!data || typeof data !== 'object') return data;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const isEmpty =
      value && // null, undefined 가 아닌 값
      typeof value === 'object' && // 객체 타입
      !Array.isArray(value) && // 배열이 아닌 값
      !(value instanceof Date) && // Date 객체 아닌 값
      Object.keys(value).length === 0; // 빈 객체인 경우

    // 빈 객체가 아닌 필드만 결과에 포함
    if (!isEmpty) {
      result[key] = value;
    }
  }

  return result as T;
};

export default prisma;
