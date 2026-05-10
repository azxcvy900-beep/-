'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Activity, 
  Package, 
  ExternalLink,
  ChevronLeft,
  Store,
  Plus,
  CreditCard,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Order, StoreInfo } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';
import styles from './dashboard.module.css';

interface DashboardContentProps {
  orders: Order[];
  storeInfo: StoreInfo | null;
  username: string | null;
  storeSlug: string;
}

export default function DashboardContent({ orders, storeInfo, username, storeSlug }: DashboardContentProps) {
  const t = useTranslations('Admin');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className={styles.dashboard}>
        {/* Hero Section */}
        <div className={styles.heroBanner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              مرحباً بك، <span>{username || 'التاجر'}</span> 👋
            </h1>
            <p className={styles.heroSubtitle}>نظرة عامة على أداء متجرك اليوم.</p>
            
            <div className={styles.shareBox}>
               <Store size={20} className="text-amber-500" />
               <span className={styles.storeUrl}>buyers.app/{storeSlug}</span>
               <button className="text-slate-400 hover:text-white transition-colors" onClick={() => {
                 navigator.clipboard.writeText(`https://buyers.app/${storeSlug}`);
                 triggerHaptic('success');
               }}>
                  <ExternalLink size={16} />
               </button>
            </div>
          </div>
          
          <div className={styles.heroActions}>
            <Link href="/admin/products" className={styles.premiumBtn} onClick={() => triggerHaptic('medium')}>
              <ShoppingBag size={20} />
              إدارة المنتجات
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>إجمالي المبيعات</p>
              <h3 className={styles.statValue}>{totalRevenue.toLocaleString()} <small className="text-xs">SAR</small></h3>
              <p className={styles.statSub}>+12.5% من الشهر الماضي</p>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
              <TrendingUp size={28} />
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>الطلبات الجديدة</p>
              <h3 className={styles.statValue}>{orders.length}</h3>
              <p className={styles.statSub}>+5 اليوم</p>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <ShoppingBag size={28} />
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>متوسط قيمة الطلب</p>
              <h3 className={styles.statValue}>{orders.length > 0 ? (totalRevenue / orders.length).toFixed(1) : 0}</h3>
              <p className={styles.statSub}>ريال سعودي لكل طلب</p>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Activity size={28} />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className={styles.mainGrid}>
            {/* Recent Orders */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>أحدث الطلبات</h2>
                    <Link href="/admin/orders" className={styles.viewAll}>عرض الكل <ChevronLeft size={16} /></Link>
                </div>
                
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>العميل</th>
                                <th>المبلغ</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 5).map(order => (
                                <tr key={order.id}>
                                    <td><span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span></td>
                                    <td>{order.address.fullName}</td>
                                    <td>{order.total} {order.currency}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                                            {order.status === 'pending' ? 'انتظار' : order.status === 'processing' ? 'تجهيز' : 'مكتمل'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">لا توجد طلبات بعد</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>إجراءات سريعة</h2>
                </div>
                <div className="flex flex-col gap-4">
                    <Link href="/admin/products/new" className={styles.topProductCard}>
                        <div className="bg-amber-500/10 p-3 rounded-xl">
                            <Plus className="text-amber-500" size={24} />
                        </div>
                        <div>
                            <p className="font-bold">إضافة منتج جديد</p>
                            <p className="text-xs text-slate-500">أضف منتجاتك وابدأ البيع</p>
                        </div>
                    </Link>
                    
                    <Link href="/admin/settings" className={styles.topProductCard}>
                        <div className="bg-blue-500/10 p-3 rounded-xl">
                            <Store className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <p className="font-bold">إعدادات المتجر</p>
                            <p className="text-xs text-slate-500">تخصيص الهوية والألوان</p>
                        </div>
                    </Link>

                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="text-amber-500" size={24} />
                            <h4 className="font-black">باقة بزنس 👑</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            متجرك الآن في وضع الوصول الكامل. استمتع بكافة الميزات الاحترافية دون حدود.
                        </p>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
