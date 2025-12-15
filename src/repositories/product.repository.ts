import prisma from '../utils/prisma.js';

export class ProductRepository {
  async findById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
    });
  }
}

export default new ProductRepository();
