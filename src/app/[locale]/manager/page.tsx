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
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllStores, getAllPlatformOrders, getAllPlatformReviews, StoreInfo } from '@/lib/api';
import { Order } from '@/lib/store';
import { Review } from '@/lib/api';
import styles from './manager.module.css';

export default function OperationsRoom() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [storesData, ordersData, reviewsData] = await Promise.all([
          getAllStores(),
          getAllPlatformOrders(),
          getAllPlatformReviews()
        ]);
        setStores(storesData);
        setOrders(ordersData);
        setReviews(reviewsData);
      } catch (error) {
        console.error("Operations data load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Analytics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeMerchants = stores.length;
  const criticalComplaints = reviews.filter(r => r.rating <= 2).length;

  const getStoreStats = (slug: string) => {
    const storeOrders = orders.filter(o => o.items.some((i: any) => i.storeSlug === slug));
    const storeReviews = reviews.filter(r => r.storeSlug === slug);
    const revenue = storeOrders.reduce((sum, o) => sum + o.total, 0);
    const avgRating = storeReviews.length > 0 
      ? storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length 
      : 5;
    const complaints = storeReviews.filter(r => r.rating <= 2).length;
    
    return { revenue, avgRating, complaints, orderCount: storeOrders.length };
  };

  const merchantRanking = stores.map(store => ({
    ...store,
    stats: getStoreStats(store.slug)
  })).sort((a, b) => b.stats.revenue - a.stats.revenue);

  const stats = [
    { label: 'إجمالي الحجم المالي', value: `${totalRevenue.toLocaleString()} ر.ي`, icon: TrendingUp, delta: '+12%', color: '#3b82f6' },
    { label: 'التجار النشطون', value: activeMerchants, icon: Users, delta: '+2', color: '#8b5cf6' },
    { label: 'الطلبات الكلية', value: orders.length, icon: ShoppingBag, delta: '+54', color: '#10b981' },
    { label: 'تحذيرات الرضا', value: criticalComplaints, icon: AlertTriangle, delta: 'مستقر', color: '#ef4444' },
  ];

  if (loading) return <div className={styles.loading}>جاري فحص بروتوكولات المنصة...</div>;

  return (
    <div className={styles.opsRoom}>
      <div className={styles.pulseHeader}>
        <h1>نبض المنصة العالمي <Activity size={24} className={styles.pulseIcon} /></h1>
        <p>مراقبة مباشرة لأداء المتاجر والنشاط المالي في اليمن</p>
      </div>

      <div className={styles.statGrid}>
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={styles.statCard}
          >
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className={styles.statContent}>
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
              <span className={stat.delta.startsWith('+') ? styles.positive : ''}>{stat.delta}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        {/* Merchant Radar */}
        <div className={styles.header}>
          <div className={styles.titleInfo}>
            <h1 className={styles.title}>لوحة الإدارة الاستراتيجية</h1>
            <p className={styles.subtitle}>الرقابة الشاملة والتحليل المتقدم لمنصة بايرز</p>
          </div>
          <div className={styles.radarList}>
             {merchantRanking.map((merchant, i) => (
               <div key={merchant.slug} className={styles.radarItem}>
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
               </div>
             ))}
          </div>
        </div>

        {/* Global Map & Pulse */}
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
              {reviews.filter(r => r.rating <= 3).slice(0, 3).map(r => (
                <div key={r.id} className={styles.complaintItem}>
                   <MessageSquareWarning size={16} color="#ef4444" />
                   <div className={styles.compDetail}>
                      <p><strong>{r.customerName}</strong>: {r.comment}</p>
                      <small>متجر: {r.storeSlug} • {new Date(r.date).toLocaleDateString()}</small>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
