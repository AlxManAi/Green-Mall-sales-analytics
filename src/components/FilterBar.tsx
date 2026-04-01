import React from 'react';
import { MapPin, Tag, Calendar, Filter } from 'lucide-react';

interface FilterBarProps {
  cities: string[];
  categories: string[];
  selectedCity: string;
  selectedCategory: string;
  startDate: string;
  endDate: string;
  onCityChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onApply: () => void;
  loading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  cities,
  categories,
  selectedCity,
  selectedCategory,
  startDate,
  endDate,
  onCityChange,
  onCategoryChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  loading,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-end gap-4">
      <div className="space-y-1.5 flex-1 min-w-[200px]">
        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> Выбери город
        </label>
        <select
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Все города (США)</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-1.5 flex-1 min-w-[200px]">
        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Tag className="w-3 h-3" /> Выбери категорию
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" /> Период (От)
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" /> Период (До)
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <button
        onClick={onApply}
        disabled={loading}
        className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 h-[38px]"
      >
        <Filter className="w-4 h-4" /> Применить фильтр
      </button>
    </div>
  );
};
