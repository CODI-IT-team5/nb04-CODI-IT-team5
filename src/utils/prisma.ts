import { DeletedTokenReason, PrismaClient } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';

const basePrisma = new PrismaClient().$extends(
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

export default prisma;
