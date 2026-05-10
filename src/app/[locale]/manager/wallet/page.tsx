'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  DollarSign,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  getPlatformFinancialStats, 
  getPlatformTransactions, 
  Transaction 
} from '@/lib/api';
import styles from '../manager.module.css';

const ManagerWallet = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingPayouts: 0, transactionCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        getPlatformFinancialStats(),
        getPlatformTransactions()
      ]);
      setStats(s);
      setTransactions(t);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.storeSlug?.toLowerCase().includes(search.toLowerCase()) || 
                          t.note?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Sample data for charts (in a real app, this would be derived from transactions)
  const chartData = [
    { name: 'الأسبوع 1', revenue: 4000, payouts: 2400 },
    { name: 'الأسبوع 2', revenue: 3000, payouts: 1398 },
    { name: 'الأسبوع 3', revenue: 2000, payouts: 9800 },
    { name: 'الأسبوع 4', revenue: 2780, payouts: 3908 },
    { name: 'الأسبوع 5', revenue: 1890, payouts: 4800 },
    { name: 'الأسبوع 6', revenue: 2390, payouts: 3800 },
    { name: 'الأسبوع 7', revenue: 3490, payouts: 4300 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'failed': return <XCircle size={16} className="text-rose-500" />;
      default: return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.opsRoom}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.opsRoom}>
      <div className={styles.pulseHeader}>
        <div className={styles.titleInfo}>
          <h1>
            <Wallet className={styles.pulseIcon} />
            محفظة المنصة والعمليات المالية
          </h1>
          <p>مراقبة العمولات، إدارة السحبيات، وتحليل الأداء المالي العام.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20 backdrop-blur-sm transition-all">
            <Download size={18} />
            تصدير التقرير
          </button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <TrendingUp />
          </div>
          <div className={styles.statContent}>
            <p>إجمالي أرباح العمولات</p>
            <h3>{stats.totalRevenue.toLocaleString()} <small className="text-sm font-normal opacity-70">YER</small></h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock />
          </div>
          <div className={styles.statContent}>
            <p>سحبيات قيد الانتظار</p>
            <h3>{stats.pendingPayouts.toLocaleString()} <small className="text-sm font-normal opacity-70">YER</small></h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <DollarSign />
          </div>
          <div className={styles.statContent}>
            <p>إجمالي العمليات</p>
            <h3>{stats.transactionCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-[28px] p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800">الأداء المالي الأسبوعي</h2>
              <p className="text-slate-500 text-sm">مقارنة بين إيرادات العمولات والسحبيات المدفوعة</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="payouts" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-[28px] p-8 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2">إشعار للمدير</h2>
            <p className="text-slate-400 text-sm mb-6">يتم احتساب العمولات تلقائياً بنسبة 2.5% من إجمالي المبيعات المكتملة.</p>
            
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 mb-1">الرصيد القابل للسحب (كافة المتاجر)</p>
                <p className="text-2xl font-black">1,450,200 <small className="text-sm font-normal opacity-50">YER</small></p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 mb-1">صافي أرباح المنصة المتوقعة (هذا الشهر)</p>
                <p className="text-2xl font-black text-emerald-400">+36,250 <small className="text-sm font-normal opacity-50">YER</small></p>
              </div>
            </div>
          </div>
          
          <button className="relative z-10 w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all mt-8">
            تحديث أسعار الصرف
          </button>

          <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">سجل العمليات المالية</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن متجر أو عملية..."
                className="pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">كافة العمليات</option>
              <option value="commission">عمولات</option>
              <option value="payout">سحبيات</option>
              <option value="subscription">اشتراكات</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm">
                <th className="px-8 py-4 font-bold">العملية</th>
                <th className="px-8 py-4 font-bold">المتجر</th>
                <th className="px-8 py-4 font-bold">المبلغ</th>
                <th className="px-8 py-4 font-bold">التاريخ</th>
                <th className="px-8 py-4 font-bold">الحالة</th>
                <th className="px-8 py-4 font-bold">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredTransactions.map((t) => (
                  <motion.tr 
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          t.type === 'commission' ? 'bg-emerald-50 text-emerald-600' : 
                          t.type === 'payout' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {t.type === 'commission' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <span className="font-bold text-slate-700">
                          {t.type === 'commission' ? 'عمولة مبيعات' : 
                           t.type === 'payout' ? 'سحب أرباح' : 'اشتراك باقة'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-600">@{t.storeSlug || 'نظام'}</td>
                    <td className="px-8 py-5">
                      <span className={`font-bold ${t.type === 'commission' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {t.type === 'commission' ? '+' : '-'}{t.amount.toLocaleString()} {t.currency}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-500 text-sm">
                      {new Date(t.date).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long' })}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(t.status)}
                        <span className="text-sm font-medium">
                          {t.status === 'completed' ? 'مكتملة' : t.status === 'pending' ? 'قيد الانتظار' : 'فاشلة'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-400 max-w-[200px] truncate">{t.note}</p>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">
                    لا توجد عمليات مالية مطابقة للبحث حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerWallet;
