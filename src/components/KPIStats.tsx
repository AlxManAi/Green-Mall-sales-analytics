import React from 'react';
import { TrendingUp, ShoppingBag, Users, CreditCard } from 'lucide-react';
import { DashboardKPIs } from '../types';
import { formatCurrency, formatNumber } from '../lib/utils';
import { motion } from 'motion/react';

interface KPIStatsProps {
  metrics: DashboardKPIs;
  loading: boolean;
}

export const KPIStats: React.FC<KPIStatsProps> = ({ metrics, loading }) => {
  const stats = [
    {
      label: 'Общая выручка',
      value: formatCurrency(metrics.total_revenue || 0),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Всего продаж',
      value: formatNumber(metrics.total_sales || 0),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Уник. покупатели',
      value: formatNumber(metrics.unique_customers || 0),
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Средний чек',
      value: formatCurrency(metrics.avg_check || 0),
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4"
        >
          <div className={`${stat.bg} p-3 rounded-lg`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" /> : stat.value}
            </h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
