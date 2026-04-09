'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Star,
  MessageSquareWarning,
  Activity,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllStores, getAllPlatformOrders, getAllPlatformReviews, StoreInfo } from '@/lib/api';
import { Order } from '@/lib/store';
import { Review } from '@/lib/api';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import styles from './manager.module.css';

function SectionLoader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      {label}
    </div>
  );
}

export default function AdministrationDashboard() {
  // Each data source loads INDEPENDENTLY - no waiting for all
  // Each data source loads INDEPENDENTLY - no waiting for all
  const { data: stores, loading: storesLoading } = useStreamingFetch(
    () => getAllStores(), 
    [], 
    'all_stores'
  );
  const { data: orders, loading: ordersLoading } = useStreamingFetch(
    () => getAllPlatformOrders(), 
    [], 
    'all_orders'
  );
  const { data: reviews, loading: reviewsLoading } = useStreamingFetch(
    () => getAllPlatformReviews(), 
    [], 
    'all_reviews'
  );

  // Progressive rendering for merchants list
  const merchantRanking = React.useMemo(() => {
    if (!stores || !orders || !reviews) return [];
    return (stores as StoreInfo[]).map((store: StoreInfo) => {
      const storeOrders = (orders as Order[]).filter((o: Order) => o.items.some((i: any) => i.storeSlug === store.slug));
      const storeReviews = (reviews as Review[]).filter((r: Review) => r.storeSlug === store.slug);
      const revenue = storeOrders.reduce((sum: number, o: Order) => sum + o.total, 0);
      const avgRating = storeReviews.length > 0 
        ? storeReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / storeReviews.length 
        : 5;
      const complaints = storeReviews.filter((r: Review) => r.rating <= 2).length;
      return { ...store, stats: { revenue, avgRating, complaints, orderCount: storeOrders.length } };
    }).sort((a: any, b: any) => b.stats.revenue - a.stats.revenue);
  }, [stores, orders, reviews]);

  const { visibleItems: visibleMerchants } = useProgressiveLoad(merchantRanking, 3, 200);
  
  const complaintsToShow = React.useMemo(() => {
    return (reviews || []).filter((r: Review) => r.rating <= 3).slice(0, 5);
  }, [reviews]);
  const { visibleItems: visibleComplaints } = useProgressiveLoad(complaintsToShow, 2, 250);

  // Analytics - update as data arrives
  const totalRevenue = (orders || []).reduce((sum: number, o: Order) => sum + o.total, 0);
  const activeMerchants = (stores || []).length;
  const criticalComplaints = (reviews || []).filter((r: Review) => r.rating <= 2).length;

  const stats = [
    { label: 'إجمالي الحجم المالي', value: ordersLoading ? '...' : `${totalRevenue.toLocaleString()} ر.ي`, icon: TrendingUp, delta: '+12%', color: '#3b82f6', ready: !ordersLoading },
    { label: 'التجار النشطون', value: storesLoading ? '...' : activeMerchants, icon: Users, delta: '+2', color: '#8b5cf6', ready: !storesLoading },
    { label: 'الطلبات الكلية', value: ordersLoading ? '...' : (orders || []).length, icon: ShoppingBag, delta: '+54', color: '#10b981', ready: !ordersLoading },
    { label: 'تحذيرات الرضا', value: reviewsLoading ? '...' : criticalComplaints, icon: AlertTriangle, delta: 'مستقر', color: '#ef4444', ready: !reviewsLoading },
  ];

  return (
    <div className={styles.opsRoom}>
      <div className={styles.pulseHeader}>
        <h1>نبض المنصة العالمي <Activity size={24} className={styles.pulseIcon} /></h1>
        <p>مراقبة مباشرة لأداء المتاجر والنشاط المالي في اليمن</p>
      </div>

      {/* Stats cards - show immediately with progressive values */}
      <div className={styles.statGrid}>
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={styles.statCard}
          >
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className={styles.statContent}>
              <p>{stat.label}</p>
              <h3 style={{ opacity: stat.ready ? 1 : 0.4, transition: 'opacity 0.3s' }}>{stat.value}</h3>
              <span className={typeof stat.delta === 'string' && stat.delta.startsWith('+') ? styles.positive : ''}>{stat.delta}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        {/* Merchant Radar - loads progressively */}
        <div className={styles.header}>
          <div className={styles.titleInfo}>
            <h1 className={styles.title}>لوحة الإدارة الاستراتيجية</h1>
            <p className={styles.subtitle}>الرقابة الشاملة والتحليل المتقدم لمنصة بايرز</p>
          </div>
          <div className={styles.radarList}>
            {(storesLoading || ordersLoading) && visibleMerchants.length === 0 && (
              <SectionLoader label="جاري تحميل بيانات المتاجر..." />
            )}
            {visibleMerchants.map((merchant: any, i: number) => (
              <motion.div 
                key={merchant.slug} 
                className={styles.radarItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.merchantInfo}>
                   <img src={merchant.logo} alt={merchant.name} />
                   <div>
                     <h4>{merchant.name}</h4>
                     <span>{merchant.slug}</span>
                   </div>
                </div>
                <div className={styles.merchantStats}>
                   <div className={styles.mStat}>
                      <small>المبيعات</small>
                      <p>{merchant.stats.revenue.toLocaleString()} ر.ي</p>
                   </div>
                   <div className={styles.mStat}>
                      <small>الرضا</small>
                      <p className={merchant.stats.avgRating < 3 ? styles.bad : styles.good}>
                        <Star size={12} fill="currentColor" /> {merchant.stats.avgRating.toFixed(1)}
                      </p>
                   </div>
                   <div className={styles.mStat}>
                      <small>الشكاوى</small>
                      <p className={merchant.stats.complaints > 0 ? styles.alert : ''}>
                        {merchant.stats.complaints}
                      </p>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Global Map & Complaints - loads progressively */}
        <div className={styles.mapSection}>
          <div className={styles.sectionHeader}>
            <h3>توزيع النشاط الاستراتيجي</h3>
          </div>
          <div className={styles.mapWidget}>
             <Globe size={160} className={styles.globeBg} />
             <div className={styles.mapOverlay}>
                <div className={styles.activeSpot} style={{ top: '60%', left: '70%' }} data-label="صنعاء: 45 طلب" />
                <div className={styles.activeSpot} style={{ top: '75%', left: '80%' }} data-label="عدن: 22 طلب" />
                <div className={styles.activeSpot} style={{ top: '65%', left: '60%' }} data-label="تعز: 18 طلب" />
             </div>
             <div className={styles.liveFeed}>
                <p><strong>آخر عملية:</strong> شراء آيفون 15 من متجر صالح (صنعاء)</p>
             </div>
          </div>
          
          <div className={styles.complaintsBox}>
            <h4>أحدث تقارير رصد الشكاوى</h4>
            <div className={styles.complaintList}>
              {reviewsLoading && visibleComplaints.length === 0 && (
                <SectionLoader label="جاري تحميل الشكاوى..." />
              )}
              {visibleComplaints.map((r: Review) => (
                <motion.div 
                  key={r.id} 
                  className={styles.complaintItem}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                   <MessageSquareWarning size={16} color="#ef4444" />
                   <div className={styles.compDetail}>
                      <p><strong>{r.customerName}</strong>: {r.comment}</p>
                      <small>متجر: {r.storeSlug} • {new Date(r.date).toLocaleDateString()}</small>
                   </div>
                </motion.div>
              ))}
              {!reviewsLoading && visibleComplaints.length === 0 && (
                <p style={{ padding: '1rem', color: '#10b981', textAlign: 'center' }}>لا توجد شكاوى حالياً ✅</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
