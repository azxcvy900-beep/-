'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Order, getStoreOrders } from '@/lib/api';
import { useStreamingFetch } from '@/lib/hooks';
import { useSessionStore } from '@/lib/session-store';
import styles from './dashboard.module.css';

export default function DashboardContent() {
  const { storeSlug: sessionSlug, _hasHydrated } = useSessionStore();
  const slug = sessionSlug || 'demo';

  const { data: rawOrders, loading } = useStreamingFetch(() => getStoreOrders(slug), [slug], 'store_orders');
  const orders = (rawOrders as Order[]) || [];
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  if (!_hasHydrated || loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'إجمالي المبيعات', value: `${totalRevenue.toLocaleString()} ر.ي`, icon: DollarSign, trend: '+12.5%', color: '#fbbf24' },
    { label: 'عدد الطلبات', value: orders.length, icon: ShoppingBag, trend: '+5.2%', color: '#3b82f6' },
    { label: 'العملاء الجدد', value: (orders.length * 0.7).toFixed(0), icon: Users, trend: '+8.1%', color: '#10b981' },
    { label: 'معدل التحويل', value: '3.2%', icon: TrendingUp, trend: '+1.4%', color: '#8b5cf6' },
  ];

  return (
    <div className={styles.dashboard}>
       <div className={styles.header}>
          <div>
            <h1 className={styles.title}>مرحباً بك مجدداً</h1>
            <p className={styles.subtitle}>إليك نظرة سريعة على أداء متجرك اليوم.</p>
          </div>
          <button className={styles.primaryBtn}>تصدير التقرير</button>
       </div>

       <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <motion.div 
              key={i} 
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
               <div className={styles.statInfo}>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <h3 className={styles.statValue}>{stat.value}</h3>
                  <div className={styles.statTrend}>
                    <ArrowUpRight size={14} />
                    <span>{stat.trend} من الشهر الماضي</span>
                  </div>
               </div>
               <div className={styles.statIcon} style={{ background: `${stat.color}10`, color: stat.color }}>
                  <stat.icon size={24} />
               </div>
            </motion.div>
          ))}
       </div>

       <div className={styles.mainGrid}>
          <div className={styles.tableCard}>
             <div className={styles.cardHeader}>
                <h3>أحدث الطلبات</h3>
                <Link href="/admin/orders">عرض الكل</Link>
             </div>
             <div className={styles.tableWrapper}>
                <table className={styles.table}>
                   <thead>
                      <tr>
                         <th>رقم الطلب</th>
                         <th>العميل</th>
                         <th>الحالة</th>
                         <th>المبلغ</th>
                      </tr>
                   </thead>
                   <tbody>
                      {orders.slice(0, 6).map(o => (
                        <tr key={o.id}>
                           <td className={styles.idCell}>#{o.id.slice(-6).toUpperCase()}</td>
                           <td>{o.address.fullName}</td>
                           <td>
                              <span className={`${styles.statusBadge} ${styles[o.status]}`}>
                                {o.status === 'pending' ? 'في الانتظار' : 'مكتمل'}
                              </span>
                           </td>
                           <td className={styles.priceCell}>{o.total.toLocaleString()} ر.ي</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div className={styles.rightColumn}>
             <div className={styles.chartCard}>
                <div className={styles.cardHeader}>
                   <h3>نشاط المبيعات</h3>
                </div>
                <div className={styles.chartPlaceholder}>
                   {/* Realistic professional UI placeholders */}
                   <div className={styles.simpleChart}>
                      {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                        <div key={i} className={styles.chartBar} style={{ height: `${h}%` }} />
                      ))}
                   </div>
                   <div className={styles.chartLabels}>
                      <span>س</span><span>ح</span><span>ن</span><span>ث</span><span>ر</span><span>خ</span><span>ج</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
