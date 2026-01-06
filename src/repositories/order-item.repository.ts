import prisma from '../utils/prisma.js';

export class OrderItemRepository {
  async findByIdWithRelations(orderItemId: string) {
    return prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
        product: true,
      },
    });
  }

  async updateIsReviewed(orderItemId: string, isReviewed: boolean) {
    return prisma.orderItem.update({
      where: { id: orderItemId },
      data: { isReviewed },
    });
  }
}

export default new OrderItemRepository();
