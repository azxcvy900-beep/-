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
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  LayoutGrid,
  Settings
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
  const [copied, setCopied] = React.useState(false);
  
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
      if (navigator.share) {
        // Try to include the logo file if it exists and sharing files is supported
        if (storeInfo?.logo && navigator.canShare && navigator.canShare({ files: [] })) {
          try {
            const response = await fetch(storeInfo.logo);
            const blob = await response.blob();
            const file = new File([blob], 'store-logo.png', { type: blob.type });
            
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (e) {
            console.error('Could not fetch logo for sharing:', e);
          }
        }
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

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
      ready: !ordersLoading,
      href: `/${locale}/admin/orders`
    },
    { 
      label: 'مبالغ مجمّدة', 
      value: ordersLoading ? '...' : `${lockedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'بانتظار تأكيد الحوالات',
      icon: Lock, 
      color: '#f59e0b',
      ready: !ordersLoading,
      href: `/${locale}/admin/orders` 
    },
    { 
      label: 'مبالغ مؤكدة', 
      value: ordersLoading ? '...' : `${confirmedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'تم التأكد والتحصيل',
      icon: CheckCircle2, 
      color: '#3b82f6',
      ready: !ordersLoading,
      href: `/${locale}/admin/orders`
    },
    { 
      label: 'تحتاج تنبيه', 
      value: productsLoading ? '...' : lowStockProducts.length + outOfStockCount, 
      subValue: productsLoading ? '' : `${outOfStockCount} نفدت تماماً`,
      icon: AlertCircle, 
      color: '#ef4444',
      ready: !productsLoading,
      href: `/${locale}/admin/products`
    },
  ];

  const quickActions = [
    { label: 'الأقسام', icon: LayoutGrid, href: `/${locale}/admin/categories`, color: '#3b82f6' },
    { label: 'المنتجات', icon: Package, href: `/${locale}/admin/products`, color: '#8b5cf6' },
    { label: 'الطلبات', icon: ShoppingBag, href: `/${locale}/admin/orders`, color: '#10b981' },
    { label: 'الإعدادات', icon: Settings, href: `/${locale}/admin/settings`, color: '#64748b' },
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
        <div className={styles.shareCard}>
          <div className={styles.shareInfo}>
             <div className={styles.shareLogo}>
                {storeInfo?.logo ? (
                  <img src={storeInfo.logo} alt={storeInfo.name} />
                ) : (
                  <ShoppingBag size={24} />
                )}
             </div>
             <div className={styles.shareText}>
                <h3>رابط متجرك العام 🔗</h3>
                <p className={styles.storeLinkText}>{storeUrl}</p>
             </div>
          </div>
          <div className={styles.shareActions}>
            <button onClick={handleShare} className={styles.shareBtn}>
               <Share2 size={18} /> مشاركة المتجر
            </button>
            <button onClick={handleCopyLink} className={styles.copyBtn}>
               {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
               {copied ? 'تم النسخ!' : 'نسخ الرابط'}
            </button>
            <Link href={`/${locale}/store/${storeSlug || 'demo'}`} target="_blank" className={styles.visitBtn}>
               <ExternalLink size={18} /> زيارة
            </Link>
          </div>
        </div>

      {/* Stats - show immediately, values stream in */}
      <div className={styles.statGrid}>
        {ordersLoading && !orders ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          stats.map((stat, i) => (
            <Link key={i} href={stat.href} style={{ textDecoration: 'none' }}>
              <motion.div 
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
            </Link>
          ))
        )}
      </div>

      <div className={styles.quickActionsSection}>
        <h3 className={styles.quickActionsTitle}>الوصول السريع للمنصة ⚡</h3>
        <div className={styles.quickGrid}>
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className={styles.quickActionCard}>
              <div className={styles.quickIcon} style={{ backgroundColor: `${action.color}10`, color: action.color }}>
                 <action.icon size={28} />
              </div>
              <span className={styles.quickLabel}>{action.label}</span>
            </Link>
          ))}
        </div>
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
