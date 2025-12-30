import prisma from '../utils/prisma.js';

export class ProductRepository {
  async findById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
    });
  }

  async findByIdWithStoreOwner(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

export default new ProductRepository();
