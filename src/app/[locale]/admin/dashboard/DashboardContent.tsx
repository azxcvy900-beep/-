'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  TrendingUp, 
  ShoppingBag, 
  Activity, 
  ChevronLeft,
  Store,
  Plus,
  Loader2,
  ArrowUpRight,
  Package,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Order, StoreInfo, getStoreOrders, getStoreInfo } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';
import { useStreamingFetch } from '@/lib/hooks';
import { useSessionStore } from '@/lib/session-store';
import styles from './dashboard.module.css';

export default function DashboardContent() {
  const { storeSlug: sessionSlug, _hasHydrated } = useSessionStore();
  const slug = sessionSlug || 'demo';

  const { data: rawOrders, loading: ordersLoading } = useStreamingFetch(() => getStoreOrders(slug), [slug], 'store_orders');
  const { data: rawInfo, loading: infoLoading } = useStreamingFetch(() => getStoreInfo(slug), [slug], 'store_info');

  const orders = (rawOrders as Order[]) || [];
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  if (!_hasHydrated || (ordersLoading && infoLoading)) {
    return (
      <div className={styles.loading}>
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
        {/* Main Stat & Chart Row */}
        <div className={styles.topSection}>
          <div className={styles.mainStatCard}>
            <div className={styles.statHeader}>
              <div>
                <p className={styles.statLabel}>إجمالي المبيعات</p>
                <h2 className={styles.mainValue}>{totalRevenue.toLocaleString()} <small>ر.ي.</small></h2>
              </div>
              <div className={styles.statBadge}>
                ذهب +8% <ArrowUpRight size={14} />
              </div>
            </div>
            
            {/* Wavy Chart Implementation (SVG) */}
            <div className={styles.chartWrapper}>
              <svg viewBox="0 0 400 150" className={styles.wavyChart}>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,100 C50,80 80,120 120,90 C160,60 200,110 240,80 C280,50 320,90 360,70 L400,80 L400,150 L0,150 Z" 
                  fill="url(#gradient)" 
                />
                <motion.path 
                  d="M0,100 C50,80 80,120 120,90 C160,60 200,110 240,80 C280,50 320,90 360,70 L400,80" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                {/* Dots on peak */}
                <circle cx="120" cy="90" r="5" fill="#fbbf24" />
                <circle cx="280" cy="50" r="5" fill="#fbbf24" />
              </svg>
            </div>

            <div className={styles.chartLabels}>
               <span>يناير</span><span>فبراير</span><span>مارس</span><span>ابريل</span><span>مايو</span>
            </div>
          </div>

          <div className={styles.secondaryStats}>
             <div className={styles.miniStat}>
                <div className={styles.miniIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <ShoppingBag size={24} />
                </div>
                <div>
                   <p>الطلبات</p>
                   <h3>{orders.length}</h3>
                </div>
             </div>
             <div className={styles.miniStat}>
                <div className={styles.miniIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Users size={24} />
                </div>
                <div>
                   <p>العملاء</p>
                   <h3>{(orders.length * 0.8).toFixed(0)}</h3>
                </div>
             </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className={styles.contentGrid}>
           <div className={styles.tableCard}>
              <div className={styles.cardHeader}>
                 <h3>أحدث الطلبات</h3>
                 <Link href="/admin/orders" className={styles.viewLink}>عرض الكل</Link>
              </div>
              <div className={styles.tableScroll}>
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
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                           <td>#{o.id.slice(-6).toUpperCase()}</td>
                           <td>{o.address.fullName}</td>
                           <td>
                              <span className={`${styles.statusDot} ${styles[o.status]}`} />
                              {o.status === 'pending' ? 'انتظار' : 'مكتمل'}
                           </td>
                           <td>{o.total} ر.ي</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </div>

           <div className={styles.bestSellers}>
              <div className={styles.cardHeader}>
                 <h3>الأكثر مبيعاً</h3>
              </div>
              <div className={styles.productList}>
                 {orders.slice(0, 3).map((o, i) => (
                   <div key={i} className={styles.productItem}>
                      <img src={o.items[0]?.image || 'https://via.placeholder.com/50'} alt="p" />
                      <div className={styles.pInfo}>
                         <p className={styles.pName}>ثوب يمني مطرز</p>
                         <div className={styles.pRating}>
                            <Star size={10} fill="#fbbf24" color="#fbbf24" />
                            <Star size={10} fill="#fbbf24" color="#fbbf24" />
                            <Star size={10} fill="#fbbf24" color="#fbbf24" />
                         </div>
                      </div>
                      <span className={styles.pPrice}>{o.total} ر.ي</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
    </div>
  );
}

function Star({ size, fill, color }: any) {
  return <Activity size={size} color={color} style={{ fill }} />;
}
