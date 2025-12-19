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
}

export default new OrderItemRepository();
