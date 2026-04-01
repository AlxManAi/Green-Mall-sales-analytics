import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { XCircle } from 'lucide-react';
import { RevenueByCategory, MonthlyRevenue, TopProduct, TopCity, MonthlySalesByCategory } from '../types';
import { formatCurrency } from '../lib/utils';

interface SalesChartsProps {
  categoryData: RevenueByCategory[];
  monthlyData: MonthlyRevenue[];
  topProducts: TopProduct[];
  topCities: TopCity[];
  monthlySalesByCategory: MonthlySalesByCategory[];
  loading: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

export const SalesCharts: React.FC<SalesChartsProps> = ({ 
  categoryData, 
  monthlyData, 
  topProducts, 
  topCities, 
  monthlySalesByCategory,
  loading 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px] animate-pulse" />
        ))}
      </div>
    );
  }

  // Forecast calculation for monthly revenue
  const generateForecast = () => {
    if (monthlyData.length < 3) return monthlyData;
    
    const last5 = monthlyData.slice(-5);
    let totalGrowth = 0;
    for (let i = 1; i < last5.length; i++) {
      totalGrowth += last5[i].revenue - last5[i-1].revenue;
    }
    const avgGrowth = totalGrowth / (last5.length - 1);
    
    const lastMonth = new Date(monthlyData[monthlyData.length - 1].month + '-01');
    const forecast = [...monthlyData.map(d => ({ ...d, isForecast: false }))];
    
    let currentRevenue = monthlyData[monthlyData.length - 1].revenue;
    for (let i = 1; i <= 7; i++) {
      const nextMonth = new Date(lastMonth);
      nextMonth.setMonth(lastMonth.getMonth() + i);
      const monthStr = nextMonth.toISOString().slice(0, 7);
      currentRevenue += avgGrowth;
      forecast.push({
        month: monthStr,
        revenue: Math.max(0, currentRevenue),
        isForecast: true
      } as any);
    }
    return forecast;
  };

  const forecastData = generateForecast();

  // Transform monthlySalesByCategory for Multi-line chart
  const getMultiLineData = () => {
    const months: { [key: string]: any } = {};
    monthlySalesByCategory.forEach(item => {
      if (!months[item.month]) {
        months[item.month] = { month: item.month };
      }
      months[item.month][item.category_name] = item.revenue;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  };

  const multiLineData = getMultiLineData();
  const categories = Array.from(new Set(monthlySalesByCategory.map(d => d.category_name)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Monthly Revenue with Forecast */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Выручка по месяцам и Прогноз</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [formatCurrency(value), 'Выручка']} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3} 
                data={monthlyData}
                dot={(props: any) => {
                  const { cx, cy } = props;
                  if (!cx || !cy) return null;
                  return <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="#fff" strokeWidth={2} />;
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3} 
                strokeDasharray="5 5" 
                data={forecastData.filter((d: any) => d.isForecast || d.month === monthlyData[monthlyData.length-1]?.month)} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Revenue by Category (Horizontal Bar) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Выручка по категориям</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="category_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Выручка']} />
              <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]} barSize={20}>
                {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Top 10 Products (Horizontal Bar) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Топ-10 товаров по выручке</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="product_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={120} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Выручка']} />
              <Bar dataKey="total_revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Top 10 Cities (Pie Chart) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Доля городов в выручке</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={topCities}
                dataKey="total_revenue"
                nameKey="city_name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {topCities.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Multi-line Chart: Monthly Sales by Category */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Динамика продаж по категориям (Multi-line)</h3>
        <div className="h-[400px] flex items-center justify-center">
          {multiLineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={multiLineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: number) => [formatCurrency(value), 'Выручка']} 
                />
                {categories.map((cat, index) => (
                  <Line 
                    key={cat as string} 
                    type="monotone" 
                    dataKey={cat as string} 
                    stroke={COLORS[index % COLORS.length]} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-medium flex flex-col items-center gap-2">
              <XCircle className="w-8 h-8 opacity-20" />
              <span>Нет данных для отображения за выбранный период</span>
            </div>
          )}
        </div>
        {multiLineData.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {categories.map((cat, index) => (
              <div key={cat as string} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-medium text-slate-600">{cat as string}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
