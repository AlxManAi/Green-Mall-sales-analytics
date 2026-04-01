import { supabase } from '../lib/supabase';
import { 
  DashboardKPIs, 
  MonthlyRevenue, 
  RevenueByCategory, 
  TopProduct, 
  TopCity, 
  TopSeller, 
  DiscountAnalysis, 
  GenderCategoryAnalysis,
  MonthlySalesByCategory
} from '../types';

const sanitizeFilters = (args: any) => {
  const city = args?.city_filter || args?.city || args?.cityName || null;
  const category = args?.category_filter || args?.category || args?.categoryName || null;
  const start = args?.start_date || args?.startDate || null;
  const end = args?.end_date || args?.endDate || null;
  const lim = args?.lim || args?.limit || null;

  const filters: any = {};
  if (city) filters.city_filter = city;
  if (category) filters.category_filter = category;
  if (start) filters.start_date = start;
  if (end) filters.end_date = end;
  if (lim !== undefined && lim !== null) filters.lim = Number(lim);
  return filters;
};

export const dataService = {
  async getCities(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('"CityName"')
      .order('"CityName"');
    
    if (error) throw error;
    return data.map(item => item.CityName) as string[];
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('"CategoryName"')
      .order('"CategoryName"');
    
    if (error) throw error;
    return data.map(item => item.CategoryName) as string[];
  },

  async getDashboardKPIs(args?: any): Promise<DashboardKPIs> {
    const filters = sanitizeFilters(args);
    const { data, error } = await supabase.rpc('dashboard_kpis', filters);
    if (error) throw error;
    return data[0] || { total_revenue: 0, total_sales: 0, unique_customers: 0, avg_check: 0 };
  },

  async getMonthlyRevenue(args?: any): Promise<MonthlyRevenue[]> {
    const filters = sanitizeFilters(args);
    const { data, error } = await supabase.rpc('monthly_revenue', filters);
    if (error) throw error;
    return data || [];
  },

  async getRevenueByCategory(args?: any): Promise<RevenueByCategory[]> {
    const filters = sanitizeFilters(args);
    const { data, error } = await supabase.rpc('revenue_by_category', filters);
    if (error) throw error;
    return data || [];
  },

  async getTopProducts(args?: any): Promise<TopProduct[]> {
    const filters = sanitizeFilters(args);
    if (!filters.lim) filters.lim = 10;
    const { data, error } = await supabase.rpc('top_products', filters);
    if (error) throw error;
    return data || [];
  },

  async getTopCities(args?: any): Promise<TopCity[]> {
    const filters = sanitizeFilters(args);
    if (!filters.lim) filters.lim = 10;
    const { data, error } = await supabase.rpc('top_cities', filters);
    if (error) throw error;
    return data || [];
  },

  async getTopSellers(args?: any): Promise<TopSeller[]> {
    const filters = sanitizeFilters(args);
    if (!filters.lim) filters.lim = 10;
    const { data, error } = await supabase.rpc('top_sellers', filters);
    if (error) throw error;
    return data || [];
  },

  async getDiscountAnalysis(args?: any): Promise<DiscountAnalysis[]> {
    const filters = sanitizeFilters(args);
    const { data, error } = await supabase.rpc('discount_analysis', filters);
    if (error) throw error;
    return data || [];
  },

  async getGenderCategoryAnalysis(args?: any): Promise<GenderCategoryAnalysis[]> {
    const filters = sanitizeFilters(args);
    const { data, error } = await supabase.rpc('gender_category_analysis', filters);
    if (error) throw error;
    return data || [];
  },

  async getMonthlySalesByCategory(args?: any): Promise<MonthlySalesByCategory[]> {
    const filters = sanitizeFilters(args);
    const { data, error } = await supabase.rpc('monthly_sales_by_category', filters);
    if (error) throw error;
    return data || [];
  }
};
