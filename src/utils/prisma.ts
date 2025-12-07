import { PrismaClient } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';

const prisma = new PrismaClient().$extends(
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

export default prisma;
