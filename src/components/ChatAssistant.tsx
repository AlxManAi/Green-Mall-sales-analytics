import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BarChart3, Table as TableIcon, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { aiService } from '../services/aiService';
import { dataService } from '../services/dataService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../lib/utils';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  toolName?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

const QUICK_QUESTIONS = [
  { text: "Продажи по месяцам", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { text: "Топ категорий", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { text: "Прогноз продаж", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { text: "Анализ городов", icon: <PieIcon className="w-3.5 h-3.5" /> },
  { text: "Топ продавцов", icon: <TableIcon className="w-3.5 h-3.5" /> },
];

export const ChatAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! Я ваш AI-ассистент Green Mall. Я могу проанализировать продажи, категории, товары, города и работу продавцов. Задайте мне любой вопрос!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    const messageText = text.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content: messageText 
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await aiService.askQuestion(messageText, history);
      const candidates = response.candidates;
      
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        let assistantContent = '';
        let toolData = null;
        let toolName = '';

        for (const part of parts) {
          if (part.text) {
            assistantContent += part.text;
          }
          if (part.functionCall) {
            const { name, args } = part.functionCall;
            toolName = name;
            try {
              console.log(`AI calling tool: ${name}`, args);
              
              // Check if the function exists in dataService
              const serviceFunc = (dataService as any)[name];
              if (typeof serviceFunc !== 'function') {
                throw new Error(`Метод ${name} не найден в сервисе данных.`);
              }

              toolData = await serviceFunc(args);
              
              if (!toolData || (Array.isArray(toolData) && toolData.length === 0)) {
                assistantContent = "Я обратился к базе данных, но по вашему запросу данных не найдено. Попробуйте изменить фильтры или уточнить вопрос.";
              } else {
                // Get final analysis if tool was called and returned data
                const modelResponse = candidates[0].content;
                if (!modelResponse.role) modelResponse.role = 'model';

                const secondResponse = await aiService.askQuestion(
                  `Данные получены: ${JSON.stringify(toolData)}. Проанализируй их на русском языке, выдели ключевые цифры и дай интерпретацию.`,
                  [
                    ...history, 
                    { role: 'user', parts: [{ text: messageText }] },
                    modelResponse
                  ]
                );
                assistantContent = secondResponse.text || "Я проанализировал данные, но не смог сформулировать ответ. Пожалуйста, попробуйте еще раз.";
              }
            } catch (err: any) {
              console.error('Tool Call Error:', err);
              assistantContent = `Произошла ошибка при получении данных (${name}): ${err.message || 'неизвестная ошибка'}. Пожалуйста, проверьте настройки подключения или параметры запроса.`;
              toolData = null;
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(),
            role: 'assistant', 
            content: assistantContent || 'Вот данные, которые я нашел:', 
            data: toolData, 
            toolName 
          },
        ]);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(),
          role: 'assistant', 
          content: 'Не удалось получить данные. Попробуйте переформулировать вопрос.' 
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderData = (data: any, toolName: string) => {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;

    if (toolName === 'getMonthlyRevenue') {
      return (
        <div className="mt-4 space-y-4">
          <div className="h-[250px] w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={(props: any) => {
                    const { cx, cy } = props;
                    if (!cx || !cy) return null;
                    return <circle cx={cx} cy={cy} r={3} fill="#10b981" />;
                  }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (toolName === 'getRevenueByCategory' || toolName === 'getTopCities' || toolName === 'getTopProducts') {
      const xKey = toolName === 'getRevenueByCategory' ? 'category_name' : toolName === 'getTopCities' ? 'city_name' : 'product_name';
      const yKey = 'total_revenue';

      return (
        <div className="mt-4 space-y-4">
          <div className="h-[250px] w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey={xKey} type="category" fontSize={10} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey={yKey} fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2">Наименование</th>
                  <th className="px-4 py-2 text-right">Выручка</th>
                  {data[0]?.sales_count !== undefined && <th className="px-4 py-2 text-right">Продажи</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.slice(0, 5).map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 font-medium text-slate-700">{item[xKey]}</td>
                    <td className="px-4 py-2 text-right text-emerald-600 font-semibold">{formatCurrency(item[yKey])}</td>
                    {item.sales_count !== undefined && <td className="px-4 py-2 text-right text-slate-500">{formatNumber(item.sales_count)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (toolName === 'getDiscountAnalysis') {
      return (
        <div className="mt-4 space-y-4">
          <div className="h-[250px] w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="discount_range" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total_revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Выручка" />
                <Bar dataKey="sales_count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Продажи" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2">Диапазон</th>
                  <th className="px-4 py-2 text-right">Ср. скидка</th>
                  <th className="px-4 py-2 text-right">Выручка</th>
                  <th className="px-4 py-2 text-right">Продажи</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 font-medium text-slate-700">{item.discount_range}</td>
                    <td className="px-4 py-2 text-right text-slate-500">{(item.avg_discount * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right text-emerald-600 font-semibold">{formatCurrency(item.total_revenue)}</td>
                    <td className="px-4 py-2 text-right text-slate-500">{formatNumber(item.sales_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (toolName === 'getTopSellers') {
      return (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-2">Продавец</th>
                <th className="px-4 py-2 text-right">Выручка</th>
                <th className="px-4 py-2 text-right">Продажи</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-medium text-slate-700">{item.seller_name}</td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-semibold">{formatCurrency(item.total_revenue)}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{formatNumber(item.sales_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (toolName === 'getGenderCategoryAnalysis') {
      return (
        <div className="mt-4 space-y-4">
          <div className="h-[250px] w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="category_name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total_revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.gender === 'M' ? '#3b82f6' : '#ec4899'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[10px] font-bold uppercase text-slate-400">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#3b82f6] rounded-full" /> Мужчины</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#ec4899] rounded-full" /> Женщины</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">AI-Ассистент Green Mall</h3>
            <p className="text-emerald-400 text-[10px] font-medium uppercase tracking-wider">Аналитика в реальном времени</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-800 text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`space-y-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-slate">
                      <Markdown>{message.content}</Markdown>
                    </div>
                    {message.data && renderData(message.data, message.toolName || '')}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-3">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-sm text-slate-500 font-medium">Анализирую данные...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="px-6 py-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q.text)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-full text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition-all"
          >
            {q.icon}
            {q.text}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Задай вопрос о продажах..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
