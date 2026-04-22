'use client';

import React, { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Wallet,
  Lock,
  Crown,
  ChevronLeft,
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  LayoutGrid,
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getStoreOrders, 
  getStoreProducts, 
  getStoreInfo, 
  Order, 
  Product 
} from '@/lib/api';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { useSessionStore } from '@/lib/session-store';
import { StatSkeleton, ListSkeleton, TableSkeleton } from '@/components/shared/Skeletons/Skeletons';
import UsageGuard from '@/components/shared/UsageGuard/UsageGuard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import styles from './dashboard.module.css';

export default function DashboardContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug, isResolved } = useAuthStore();
  const { username } = useSessionStore();
  const [copied, setCopied] = React.useState(false);
  
  const { data: orders, loading: ordersLoading } = useStreamingFetch(
    () => getStoreOrders(storeSlug || 'demo'), 
    [storeSlug], 
    `orders_${storeSlug || 'demo'}`
  );

  const { data: products, loading: productsLoading } = useStreamingFetch(
    () => getStoreProducts(storeSlug || 'demo'), 
    [storeSlug], 
    `products_${storeSlug || 'demo'}`
  );

  const { data: storeInfo, loading: infoLoading } = useStreamingFetch(
    () => getStoreInfo(storeSlug || 'demo'), 
    [storeSlug], 
    `store_${storeSlug || 'demo'}`
  );

  const storeUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${locale}/store/${storeSlug || 'demo'}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData: any = {
      title: storeInfo?.name || 'متجري على بايرز',
      text: `تفقد متجري "${storeInfo?.name}" على منصة بايرز!`,
      url: storeUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Analytics calculation
  const activeOrders = (orders || []).filter((o: Order) => o.status !== 'cancelled');
  const totalSalesYER = activeOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
  
  const lockedFundsYER = activeOrders
    .filter((o: Order) => o.status === 'pending' || o.isPriceLocked)
    .reduce((sum: number, order: Order) => sum + order.total, 0);
  
  const confirmedFundsYER = activeOrders
    .filter((o: Order) => o.status === 'delivered')
    .reduce((sum: number, order: Order) => sum + order.total, 0);

  const lowStockThreshold = 5;
  const lowStockCount = (products || []).filter((p: Product) => p.stockCount > 0 && p.stockCount <= lowStockThreshold).length;
  const outOfStockCount = (products || []).filter((p: Product) => p.stockCount === 0).length;

  const stats = [
    { 
      label: 'إجمالي المبيعات (YER)', 
      value: ordersLoading ? '...' : `${totalSalesYER.toLocaleString()} ر.ي`, 
      subValue: 'الأرباح الكلية المسجلة',
      icon: TrendingUp, 
      color: '#10b981',
      href: `/admin/orders`
    },
    { 
      label: 'مبالغ مجمّدة', 
      value: ordersLoading ? '...' : `${lockedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'بانتظار تأكيد الحوالات',
      icon: Lock, 
      color: '#f59e0b',
      href: `/admin/orders` 
    },
    { 
      label: 'مبالغ مؤكدة', 
      value: ordersLoading ? '...' : `${confirmedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'تم التأكد والتحصيل',
      icon: CheckCircle2, 
      color: '#3b82f6',
      href: `/admin/orders`
    },
    { 
      label: 'تنبيهات المخزون', 
      value: productsLoading ? '...' : lowStockCount + outOfStockCount, 
      subValue: `${outOfStockCount} نفدت تماماً`,
      icon: AlertCircle, 
      color: '#ef4444',
      href: `/admin/products`
    },
  ];

  // Prepare chart data (Last 10 orders trend)
  const chartData = React.useMemo(() => {
    if (!orders || orders.length === 0) return Array.from({length: 10}).map((_, i) => ({ name: `T${i}`, sales: 0 }));
    return orders.slice(0, 10).reverse().map((o, i) => ({
      name: `T${i + 1}`,
      sales: o.total,
    }));
  }, [orders]);

  const recentOrders = (orders || []).slice(0, 5);
  const plan = storeInfo?.planType || 'free';
  const orderCount = storeInfo?.orderCountMonth || 0;
  const isLocked = plan === 'free' && orderCount >= 15;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.dashboard}
    >
      <UsageGuard isLocked={isLocked} orderCount={orderCount} plan={plan}>
        <Suspense fallback={<div className={styles.loading}><Loader2 className="animate-spin" size={48} /></div>}>
          
          {/* Hero Banner Section */}
          <div className={styles.heroBanner}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>مرحباً، {username || 'التاجر'} 🚀</h1>
              <p className={styles.heroSubtitle}>إليك أداء {storeInfo?.name || 'متجرك'} اليوم</p>
              
              <div className={styles.shareBox}>
                <span className={styles.storeUrl}>{storeUrl}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopyLink} className={styles.secondaryBtn} style={{ padding: '0.5rem' }}>
                    {copied ? <CheckCircle2 size={18} color="#10b981" /> : <Copy size={18} />}
                  </button>
                  <button onClick={handleShare} className={styles.secondaryBtn} style={{ padding: '0.5rem' }}>
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {plan === 'free' && (
                <div className={styles.usageBrief}>
                   استهلاك الباقة: {orderCount}/10 طلبات شهرياً
                </div>
              )}
            </div>

            <div className={styles.heroActions}>
              <Link href="/admin/billing" className={styles.premiumBtn}>
                <ShieldCheck size={18} /> ترقية الاحتراف
              </Link>
              <Link href={`/store/${storeSlug}`} target="_blank" className={styles.secondaryBtn}>
                <ExternalLink size={18} /> معاينة المتجر
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.statGrid}>
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={styles.statCard}
              >
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <h2 className={styles.statValue}>{stat.value}</h2>
                  <p className={styles.statSub}>{stat.subValue}</p>
                </div>
                <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                  <stat.icon size={28} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            <div className={styles.chartHeader}>
               <h3 className={styles.chartTitle}>نمو المبيعات (أحدث 10 طلبات)</h3>
               <TrendingUp size={20} color="#10b981" />
            </div>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className={styles.mainGrid}>
            {/* Orders Table */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>آخر الطلبيات</h3>
                <Link href="/admin/orders" className={styles.viewAll}>
                  كل الطلبات <ChevronLeft size={16} />
                </Link>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>العميل</th>
                      <th>الحالة</th>
                      <th>المبلغ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td><span className={styles.orderId}>#{order.id.slice(-6)}</span></td>
                        <td>{order.address.fullName}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td><strong>{order.total.toLocaleString()} ر.ي</strong></td>
                        <td>
                          <Link href="/admin/orders" className={styles.actionBtn}>
                            إدارة
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr><td colSpan={5} className={styles.empty}>لا توجد طلبات حتى الآن</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActionsSection}>
               <h3 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>الوصول السريع</h3>
               <div className={styles.quickGrid}>
                  <Link href="/admin/products" className={styles.quickActionCard}>
                    <div className={styles.quickIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}><Package size={24} /></div>
                    <span className={styles.quickLabel}>المنتجات</span>
                  </Link>
                  <Link href="/admin/categories" className={styles.quickActionCard}>
                    <div className={styles.quickIcon} style={{ background: '#f5f3ff', color: '#8b5cf6' }}><LayoutGrid size={24} /></div>
                    <span className={styles.quickLabel}>الأقسام</span>
                  </Link>
                  <Link href="/admin/coupons" className={styles.quickActionCard}>
                    <div className={styles.quickIcon} style={{ background: '#fdf2f8', color: '#ec4899' }}><ShoppingBag size={24} /></div>
                    <span className={styles.quickLabel}>الكوبونات</span>
                  </Link>
                  <Link href="/admin/settings" className={styles.quickActionCard}>
                    <div className={styles.quickIcon} style={{ background: '#f8fafc', color: '#64748b' }}><Settings size={24} /></div>
                    <span className={styles.quickLabel}>الإعدادات</span>
                  </Link>
               </div>
            </div>
          </div>

        </Suspense>
      </UsageGuard>
    </motion.div>
  );
}
