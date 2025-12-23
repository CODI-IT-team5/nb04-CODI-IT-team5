import { DeletedTokenReason, Prisma, PrismaClient } from '@prisma/client';

type UpdateDelegate<T> = {
  update(
    args: Prisma.Args<T, 'update'>
  ): Prisma.Result<T, Prisma.Args<T, 'update'>, 'update'>;
};

export const softDelete = () => {
  return {
    async delete<T>(
      this: T,
      args: Prisma.Args<T, 'delete'> & { reason?: DeletedTokenReason}
    ): Promise<Prisma.Result<T, Prisma.Args<T, 'update'>, 'update'>> {
      const ctx =
        Prisma.getExtensionContext(this) as unknown as UpdateDelegate<T>;

      return ctx.update({
        where: args.where,
        data: {
          deletedAt: new Date(),
          ...(args.reason ? { reason: args.reason } : {}),
        },
      } as Prisma.Args<T, 'update'>);
    },
  };
}

const prisma = new PrismaClient().$extends({
  model: {
    user: softDelete(),
    device: softDelete(),
    refreshToken: softDelete(),
    store: softDelete(),
    product: softDelete(),
    order: softDelete(),
    orderItem: softDelete(),
    payment: softDelete(),
  },
});

export default prisma;