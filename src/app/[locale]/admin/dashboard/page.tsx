'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
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
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  getStoreOrders, 
  getStoreProducts, 
  getStoreInfo, 
  getStoreAnalyticsData,
  AnalyticsData,
  Order, 
  Product 
} from '@/lib/api';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
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

function SectionLoader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      {label}
    </div>
  );
}

export default function MerchantDashboard() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug, isResolved } = useAuthStore();
  
  // Use SWR cache keys for instant load
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

  const { data: analytics } = useStreamingFetch(
    () => getStoreAnalyticsData(storeSlug || 'demo', 'month'),
    [storeSlug],
    `analytics_${storeSlug || 'demo'}`
  );

  // Progressive loading for visible orders
  const recentOrders = React.useMemo(() => (orders || []).slice(0, 6), [orders]);
  const { visibleItems: visibleOrders } = useProgressiveLoad(recentOrders, 2, 200);

  // SaaS Usage Logic
  const orderCount = storeInfo?.orderCountMonth || 0;
  const plan = storeInfo?.planType || 'free';
  const isLocked = plan === 'free' && orderCount >= 15;

  // Analytic Calculations - update as data arrives
  const activeOrders = (orders || []).filter((o: Order) => o.status !== 'cancelled');
  const totalSalesYER = activeOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
  const sarRate = storeInfo?.currencySettings?.rates?.SAR || 140;
  const totalSalesSAR = totalSalesYER / sarRate;

  const lockedOrders = activeOrders.filter((o: Order) => o.status === 'pending' || o.isPriceLocked);
  const lockedFundsYER = lockedOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
  
  const confirmedOrders = activeOrders.filter((o: Order) => o.status === 'delivered');
  const confirmedFundsYER = confirmedOrders.reduce((sum: number, order: Order) => sum + order.total, 0);

  const lowStockThreshold = 5;
  const lowStockProducts = (products || []).filter((p: Product) => p.stockCount > 0 && p.stockCount <= lowStockThreshold);
  const outOfStockCount = (products || []).filter((p: Product) => p.stockCount === 0).length;

  const { visibleItems: visibleLowStock } = useProgressiveLoad(lowStockProducts, 3, 200);
  const { visibleItems: visibleLocked } = useProgressiveLoad(lockedOrders.slice(0, 5), 2, 200);

  const stats = [
    { 
      label: 'إجمالي المبيعات (YER)', 
      value: ordersLoading ? '...' : `${totalSalesYER.toLocaleString()} ر.ي`, 
      subValue: ordersLoading ? '' : `~${totalSalesSAR.toLocaleString(undefined, { maximumFractionDigits: 0 })} ر.س`,
      icon: TrendingUp, 
      color: '#10b981',
      ready: !ordersLoading
    },
    { 
      label: 'مبالغ مجمّدة', 
      value: ordersLoading ? '...' : `${lockedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'بانتظار تأكيد الحوالات',
      icon: Lock, 
      color: '#f59e0b',
      ready: !ordersLoading
    },
    { 
      label: 'مبالغ مؤكدة', 
      value: ordersLoading ? '...' : `${confirmedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'تم التأكد والتحصيل',
      icon: CheckCircle2, 
      color: '#3b82f6',
      ready: !ordersLoading
    },
    { 
      label: 'تحتاج تنبيه', 
      value: productsLoading ? '...' : lowStockProducts.length + outOfStockCount, 
      subValue: productsLoading ? '' : `${outOfStockCount} نفدت تماماً`,
      icon: AlertCircle, 
      color: '#ef4444',
      ready: !productsLoading
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.dashboard}
    >
      <UsageGuard isLocked={isLocked} orderCount={orderCount} plan={plan}>
        <div className={styles.header}>
          <div>
            <div className={styles.titleRow}>
               <h1 className={styles.title}>لوحة تحكم التاجر 🚀</h1>
               {plan === 'free' && (
                 <div className={styles.usageBrief}>
                    استهلاك الطلبات: {orderCount}/10
                 </div>
               )}
            </div>
            <p className={styles.subtitle}>أداء {storeInfo?.name || 'متجر بايرز'} في لمح البصر</p>
          </div>
          <div className={styles.headerActions}>
            <Link href={`/${locale}/admin/billing`} className={styles.billingBtn}>
              <Crown size={18} /> ترقية الباقة
            </Link>
            <Link href={`/${locale}/admin/wallet`} className={styles.walletLink}>
              <Wallet size={18} /> المحفظة
            </Link>
          </div>
        </div>

      {/* Stats - show immediately, values stream in */}
      <div className={styles.statGrid}>
        {ordersLoading && !orders ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          stats.map((stat, i) => (
            <motion.div 
              key={i} 
              className={styles.statCard}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{stat.label}</p>
                <h2 className={styles.statValue} style={{ opacity: stat.ready ? 1 : 0.3, transition: 'opacity 0.3s' }}>{stat.value}</h2>
                <p className={styles.statSub}>{stat.subValue}</p>
              </div>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={26} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className={styles.mainGrid}>
        {/* Low Stock Alerts - stream progressively */}
        <div className={styles.actionSection}>
          <h3 className={styles.sectionTitle}>تنبيهات المخزون ⚠️</h3>
          <div className={styles.lowStockList}>
            {productsLoading && !products ? (
              <ListSkeleton count={3} />
            ) : visibleLowStock.length > 0 ? (
              visibleLowStock.map((p: Product) => (
                <motion.div 
                  key={p.id} 
                  className={styles.stockItem}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <img src={p.image} alt={p.name} />
                  <div className={styles.stockInfo}>
                    <h4>{p.name}</h4>
                    <p>المتبقي: <span className={styles.warningText}>{p.stockCount} قطع</span></p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className={styles.empty}>جميع المنتجات متوفرة بكثرة ✅</p>
            )}
          </div>
        </div>

        {/* Locked funds - stream progressively */}
        <div className={styles.topProducts}>
          <h3 className={styles.sectionTitle}>مبالغ بانتظار التأكيد 💰</h3>
          <div className={styles.productList}>
            {ordersLoading && !products ? (
              <ListSkeleton count={3} />
            ) : visibleLocked.length > 0 ? (
              visibleLocked.map((order: Order) => (
                <motion.div 
                  key={order.id} 
                  className={styles.productItem}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={styles.prodInfo}>
                    <h4>#{order.id.slice(-6)}</h4>
                    <p>{order.address.fullName}</p>
                  </div>
                  <div className={styles.prodPrice}>
                    {order.total.toLocaleString()} ر.ي
                  </div>
                </motion.div>
              ))
            ) : (
              <p className={styles.empty}>لا توجد مبالغ معلقة ✅</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders - stream progressively */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>أحدث الطلبات القادمة 📦</h3>
          <Link href={`/${locale}/admin/orders`} className={styles.viewAll}>
            إدارة كافة الطلبات <ChevronLeft size={16} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          {ordersLoading && !orders ? (
            <TableSkeleton rows={4} />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>الحالة</th>
                  <th>الإجمالي</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.length === 0 && !ordersLoading && (
                   <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد طلبات حديثة.</td></tr>
                )}
                {visibleOrders.map((order: Order) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td><span className={styles.orderId}>#{order.id.slice(-6)}</span></td>
                    <td>{order.address.fullName}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className={styles.amount}>{order.total.toLocaleString()} ر.ي</td>
                    <td>
                      <Link href={`/${locale}/admin/orders`} className={styles.actionBtn}>
                        معالجة
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      </UsageGuard>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
