import { dashboardRepository } from '../repositories/dashboard.repository.js';
import type { PeriodStats } from '../types/dashboard.type.js';
import { cacheManager, dashboardCache } from '../utils/cache.js';
import { HttpException } from '../utils/http-exception.js';
import { logger } from '../utils/logger.js';

const DASHBOARD_CACHE_KEY_PREFIX = 'store:';

// 타입 정의
const getDateRange = (period: 'today' | 'week' | 'month' | 'year', offset = 0) => {
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
};

// 기간별 주문 집계
async function getPeriodStats(storeId: string, start: Date, end: Date) {
  const orderItems = await dashboardRepository.findOrderItemsByPeriod(storeId, start, end);

  // 고유 주문 ID 개수 = 주문 건수
  const uniqueOrders = new Set(orderItems.map((item) => item.orderId));
  const totalOrders = uniqueOrders.size;

  // 실제 판매 금액 = price × quantity 합계
  const totalSales = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { totalOrders, totalSales };
}

function calculateChangeRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

class DashboardService {
  async getDashboard(userId: string) {
    // 판매자의 스토어 조회
    const store = await dashboardRepository.findStoreByUserId(userId);

    if (!store) {
      throw HttpException.notFound();
    }

    // 캐시 확인
    const cacheKey = `${DASHBOARD_CACHE_KEY_PREFIX}${store.id}`;
    const cached = dashboardCache.get(cacheKey);
    if (cached) {
      logger.debug({ target: 'cache', event: 'hit', cache: 'dashboard', storeId: store.id }, '대시보드 캐시 히트');
      return cached;
    }

    // 기간별 통계 계산 (병렬 처리)
    const periods = ['today', 'week', 'month', 'year'] as const;

    const statsPromises = periods.map(async (period) => {
      const currentRange = getDateRange(period, 0);
      const previousRange = getDateRange(period, -1);

      const [current, previous] = await Promise.all([
        getPeriodStats(store.id, currentRange.start, currentRange.end),
        getPeriodStats(store.id, previousRange.start, previousRange.end),
      ]);

      return {
        period,
        data: {
          current,
          previous,
          changeRate: {
            totalOrders: calculateChangeRate(current.totalOrders, previous.totalOrders),
            totalSales: calculateChangeRate(current.totalSales, previous.totalSales),
          },
        },
      };
    });

    const statsArray = await Promise.all(statsPromises);
    const stats: Record<string, PeriodStats> = {};
    statsArray.forEach(({ period, data }) => {
      stats[period] = data;
    });

    // TOP 5 판매 상품
    const topSales = await dashboardRepository.findTopProducts(store.id, 5);

    const topSalesFormatted = topSales.map((p) => ({
      totalOrders: p.salesCount,
      product: {
        id: p.id,
        name: p.name,
        price: p.price,
      },
    }));

    // 가격대별 매출 비중
    const allOrderItems = await dashboardRepository.findAllOrderItemsByStore(store.id);

    const priceRanges: Record<string, number> = {
      '~20,000원': 0,
      '~50,000원': 0,
      '~100,000원': 0,
      '~200,000원': 0,
      '200,000원~': 0,
    };

    let totalRevenue = 0;

    allOrderItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      totalRevenue += itemTotal;

      if (item.price <= 20000) {
        priceRanges['~20,000원'] = (priceRanges['~20,000원'] ?? 0) + itemTotal;
      } else if (item.price <= 50000) {
        priceRanges['~50,000원'] = (priceRanges['~50,000원'] ?? 0) + itemTotal;
      } else if (item.price <= 100000) {
        priceRanges['~100,000원'] = (priceRanges['~100,000원'] ?? 0) + itemTotal;
      } else if (item.price <= 200000) {
        priceRanges['~200,000원'] = (priceRanges['~200,000원'] ?? 0) + itemTotal;
      } else {
        priceRanges['200,000원~'] = (priceRanges['200,000원~'] ?? 0) + itemTotal;
      }
    });

    const priceRange = Object.entries(priceRanges).map(([range, sales]) => ({
      priceRange: range,
      totalSales: sales,
      percentage: totalRevenue > 0 ? Math.round((sales / totalRevenue) * 1000) / 10 : 0,
    }));

    const result = {
      ...stats,
      topSales: topSalesFormatted,
      priceRange,
    };

    // 캐시에 저장
    dashboardCache.set(cacheKey, result);
    logger.debug(
      { target: 'cache', event: 'miss', cache: 'dashboard', storeId: store.id },
      '대시보드 캐시 미스 - DB에서 조회',
    );

    return result;
  }

  invalidateDashboardCache(storeId: string) {
    cacheManager.invalidate('dashboard', `${DASHBOARD_CACHE_KEY_PREFIX}${storeId}`);
  }
}

export const dashboardService = new DashboardService();
