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
}

export default new OrderItemRepository();
