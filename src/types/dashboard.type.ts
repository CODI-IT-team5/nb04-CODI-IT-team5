export interface PeriodStats {
  current: {
    totalOrders: number;
    totalSales: number;
  };
  previous: {
    totalOrders: number;
    totalSales: number;
  };
  changeRate: {
    totalOrders: number;
    totalSales: number;
  };
}

export interface TopSale {
  totalOrders: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

export interface PriceRangeData {
  priceRange: string;
  totalSales: number;
  percentage: number;
}

export interface DashboardResponse {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  year: PeriodStats;
  topSales: TopSale[];
  priceRange: PriceRangeData[];
}
