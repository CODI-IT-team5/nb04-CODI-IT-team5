import prisma from '../utils/prisma.js';

export class OrderItemRepository {
  async findByIdWithRelations(id: string) {
    return prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
          },
        },
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
