export interface DashboardKPIs {
  total_revenue: number;
  total_sales: number;
  unique_customers: number;
  avg_check: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface RevenueByCategory {
  category_name: string;
  total_revenue: number;
  sales_count: number;
}

export interface TopProduct {
  product_name: string;
  total_revenue: number;
}

export interface TopCity {
  city_name: string;
  total_revenue: number;
  sales_count: number;
}

export interface TopSeller {
  seller_name: string;
  gender: string;
  sales_count: number;
  total_revenue: number;
}

export interface DiscountAnalysis {
  discount_range: string;
  avg_discount: number;
  total_revenue: number;
  sales_count: number;
}

export interface GenderCategoryAnalysis {
  gender: string;
  category_name: string;
  total_revenue: number;
  sales_count: number;
}

export interface MonthlySalesByCategory {
  month: string;
  category_name: string;
  revenue: number;
}
