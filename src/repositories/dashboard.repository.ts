import prisma from '../utils/prisma.js';

class DashboardRepository {
  // 판매자의 스토어 조회
  async findStoreByUserId(userId: string) {
    return prisma.store.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  // 기간별 주문 아이템 조회
  async findOrderItemsByPeriod(storeId: string, start: Date, end: Date) {
    return prisma.orderItem.findMany({
      where: {
        product: { storeId },
        order: {
          createdAt: { gte: start, lte: end },
          status: { not: 'Cancelled' },
        },
      },
      select: {
        price: true,
        quantity: true,
        orderId: true,
      },
    });
  }

  // TOP 5 판매 상품 조회
  async findTopProducts(storeId: string, limit: number = 5) {
    return prisma.product.findMany({
      where: { storeId },
      orderBy: { salesCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        salesCount: true,
      },
    });
  }

  // 전체 주문 아이템 조회 (가격대별 분석용)
  async findAllOrderItemsByStore(storeId: string) {
    return prisma.orderItem.findMany({
      where: {
        product: { storeId },
        order: { status: { not: 'Cancelled' } },
      },
      select: {
        price: true,
        quantity: true,
      },
    });
  }
}

export const dashboardRepository = new DashboardRepository();
