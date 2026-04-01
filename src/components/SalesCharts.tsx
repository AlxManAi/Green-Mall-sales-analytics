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
import { RevenueByCategory, MonthlyRevenue, TopProduct, TopCity } from '../types';
import { formatCurrency } from '../lib/utils';

interface SalesChartsProps {
  categoryData: RevenueByCategory[];
  monthlyData: MonthlyRevenue[];
  topProducts: TopProduct[];
  topCities: TopCity[];
  loading: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

export const SalesCharts: React.FC<SalesChartsProps> = ({ 
  categoryData, 
  monthlyData, 
  topProducts, 
  topCities, 
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
    </div>
  );
};
