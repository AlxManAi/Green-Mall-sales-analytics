import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, MessageSquare, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { KPIStats } from './components/KPIStats';
import { SalesCharts } from './components/SalesCharts';
import { FilterBar } from './components/FilterBar';
import { ChatAssistant } from './components/ChatAssistant';
import { dataService } from './services/dataService';
import { DashboardKPIs, RevenueByCategory, MonthlyRevenue, TopProduct, TopCity, MonthlySalesByCategory } from './types';
import { motion } from 'motion/react';
import { supabase } from './lib/supabase';

export default function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filter States
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('2018-01-01');
  const [endDate, setEndDate] = useState('2018-12-31');

  // Data States
  const [metrics, setMetrics] = useState<DashboardKPIs>({
    total_revenue: 0,
    total_sales: 0,
    unique_customers: 0,
    avg_check: 0,
  });
  const [categoryData, setCategoryData] = useState<RevenueByCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCities, setTopCities] = useState<TopCity[]>([]);
  const [monthlySalesByCategory, setMonthlySalesByCategory] = useState<MonthlySalesByCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkConnection = async () => {
    try {
      // Try to call a simple RPC or select to verify connection
      const { error } = await supabase.from('cities').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('Supabase connection error:', error);
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Supabase connection exception:', err);
      setIsConnected(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const filters = {
      city_filter: selectedCity || null,
      category_filter: selectedCategory || null,
      start_date: startDate || null,
      end_date: endDate || null
    };

    try {
      // Fetch essential data first
      const [m, c, d, p, ct, msc] = await Promise.all([
        dataService.getDashboardKPIs(filters).catch(e => { console.error('KPIs Error:', e); return metrics; }),
        dataService.getRevenueByCategory(filters).catch(e => { console.error('Category Error:', e); return []; }),
        dataService.getMonthlyRevenue(filters).catch(e => { console.error('Monthly Error:', e); return []; }),
        dataService.getTopProducts({ lim: 10, ...filters }).catch(e => { console.error('Products Error:', e); return []; }),
        dataService.getTopCities({ lim: 10, ...filters }).catch(e => { console.error('Cities Error:', e); return []; }),
        dataService.getMonthlySalesByCategory(filters).catch(e => { console.error('Monthly Category Error:', e); return []; }),
      ]);
      
      setMetrics(m);
      setCategoryData(c);
      setMonthlyData(d);
      setTopProducts(p);
      setTopCities(ct);
      setMonthlySalesByCategory(msc);

      // Fetch lists for filters if empty
      if (cities.length === 0 || categories.length === 0) {
        const [citiesList, categoriesList] = await Promise.all([
          dataService.getCities().catch(() => []),
          dataService.getCategories().catch(() => []),
        ]);
        if (citiesList.length > 0) setCities(citiesList);
        if (categoriesList.length > 0) setCategories(categoriesList);
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Critical data fetch error:', error);
      // Don't set isConnected to false if we have some data, but here it's a critical catch
      if (!metrics.total_revenue) setIsConnected(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, selectedCategory, startDate, endDate, cities, categories, metrics]);

  useEffect(() => {
    checkConnection();
    fetchData();
  }, []);

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Аналитик продаж Green Mall
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isConnected === false ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-300'}`} />
              <span className="text-xs font-medium text-slate-500">
                {isConnected ? 'Подключено' : isConnected === false ? 'Ошибка подключения' : 'Подключение...'}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Filters Section */}
        <FilterBar
          cities={cities}
          categories={categories}
          selectedCity={selectedCity}
          selectedCategory={selectedCategory}
          startDate={startDate}
          endDate={endDate}
          onCityChange={setSelectedCity}
          onCategoryChange={setSelectedCategory}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApply={handleApplyFilters}
          loading={loading}
        />

        {/* Dashboard Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <LayoutDashboard className="w-5 h-5 text-emerald-600" />
              <span>Дашборд продаж</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Данные по США {selectedCity && `• ${selectedCity}`} {selectedCategory && `• ${selectedCategory}`}
            </div>
          </div>

          <KPIStats metrics={metrics} loading={loading} />
          
          <SalesCharts 
            categoryData={categoryData} 
            monthlyData={monthlyData} 
            topProducts={topProducts}
            topCities={topCities}
            monthlySalesByCategory={monthlySalesByCategory}
            loading={loading} 
          />
        </section>

        {/* AI Assistant Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">Интеллектуальный помощник</h2>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ChatAssistant />
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center pb-8 border-t border-slate-200 pt-8">
        <p className="text-xs text-slate-400 font-medium">
          &copy; 2026 Green Mall BI System. Все права защищены. Разработано для аналитики продаж в США.
        </p>
      </footer>
    </div>
  );
}
