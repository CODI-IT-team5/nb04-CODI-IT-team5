import prisma from '../utils/prisma.js';

// 기간별 시작/끝 날짜 계산 헬퍼
function getDateRange(period: 'today' | 'week' | 'month' | 'year', offset = 0) {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'today': {
      const day = new Date(now);
      day.setDate(day.getDate() + offset);
      start = new Date(day.setHours(0, 0, 0, 0));
      end = new Date(day.setHours(23, 59, 59, 999));
      break;
    }
    case 'week': {
      const weekStart = new Date(now);
      const dayOfWeek = weekStart.getDay(); // 0(일) ~ 6(토)
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일 기준
      weekStart.setDate(weekStart.getDate() + diff + offset * 7);
      start = new Date(weekStart.setHours(0, 0, 0, 0));
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      start = new Date(month.setHours(0, 0, 0, 0));
      end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear() + offset, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
}

// 기간별 주문 집계
async function getPeriodStats(storeId: string, start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      orderItems: {
        some: {
          product: { storeId },
        },
      },
      status: { not: 'Cancelled' },
    },
    select: {
      subtotal: true,
    },
  });

  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + o.subtotal, 0);

  return { totalOrders, totalSales };
}

// 변화율 계산
function calculateChangeRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const dashboardService = {
  async getDashboard(userId: string) {
    // 판매자의 스토어 조회
    const store = await prisma.store.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!store) {
      throw new Error('스토어를 찾을 수 없습니다.');
    }

    // 기간별 통계 계산
    const periods = ['today', 'week', 'month', 'year'] as const;
    const stats: any = {};

    for (const period of periods) {
      const currentRange = getDateRange(period, 0);
      const previousRange = getDateRange(period, -1);
      
      const current = await getPeriodStats(store.id, currentRange.start, currentRange.end);
      const previous = await getPeriodStats(store.id, previousRange.start, previousRange.end);

      stats[period] = {
        current,
        previous,
        changeRate: {
          totalOrders: calculateChangeRate(current.totalOrders, previous.totalOrders),
          totalSales: calculateChangeRate(current.totalSales, previous.totalSales),
        },
      };
    }

    // TOP 5 판매 상품
    const topSales = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { salesCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        price: true,
        salesCount: true,
      },
    });

    const topSalesFormatted = topSales.map((p) => ({
      totalOrders: p.salesCount,
      product: {
        id: p.id,
        name: p.name,
        price: p.price,
      },
    }));

    // 가격대별 매출 비중
    const allOrders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            product: { storeId: store.id },
          },
        },
        status: { not: 'Cancelled' },
      },
      include: {
        orderItems: {
          where: {
            product: { storeId: store.id },
          },
          select: {
            price: true,
            quantity: true,
          },
        },
      },
    });

    const priceRanges = {
      '만원 이하': 0,
      '1만원 ~ 3만원': 0,
      '3만원 ~ 5만원': 0,
      '5만원 이상': 0,
    };

    let totalRevenue = 0;

    allOrders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        totalRevenue += itemTotal;

        if (item.price <= 10000) {
          priceRanges['만원 이하'] += itemTotal;
        } else if (item.price <= 30000) {
          priceRanges['1만원 ~ 3만원'] += itemTotal;
        } else if (item.price <= 50000) {
          priceRanges['3만원 ~ 5만원'] += itemTotal;
        } else {
          priceRanges['5만원 이상'] += itemTotal;
        }
      });
    });

    const priceRange = Object.entries(priceRanges).map(([range, sales]) => ({
      priceRange: range,
      totalSales: sales,
      percentage: totalRevenue > 0 ? Math.round((sales / totalRevenue) * 1000) / 10 : 0,
    }));

    return {
      ...stats,
      topSales: topSalesFormatted,
      priceRange,
    };
  },
};
