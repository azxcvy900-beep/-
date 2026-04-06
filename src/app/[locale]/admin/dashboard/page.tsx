'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getStoreOrders, getStoreProducts, Product } from '@/lib/api';
import { Order } from '@/lib/store';
import styles from './dashboard.module.css';

export default function MerchantDashboard() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersData, productsData] = await Promise.all([
          getStoreOrders('demo'),
          getStoreProducts('demo')
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);

  const stats = [
    { 
      label: t('dashboard.totalSales'), 
      value: `${totalSales.toLocaleString()} ر.ي`, 
      icon: TrendingUp, 
      class: 'sales' 
    },
    { 
      label: t('dashboard.totalOrders'), 
      value: orders.length, 
      icon: ShoppingBag, 
      class: 'orders' 
    },
    { 
      label: t('dashboard.activeProducts'), 
      value: products.length, 
      icon: Package, 
      class: 'products' 
    },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>جاري تحميل الإحصائيات...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.statGrid}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles[stat.class]}`}>
              <stat.icon size={24} />
            </div>
            <p className={styles.statLabel}>{stat.label}</p>
            <h2 className={styles.statValue}>{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('dashboard.recentOrders')}</h3>
          <Link href={`/${locale}/admin/orders`} className={styles.viewAll}>
            عرض الكل <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('orders.orderId')}</th>
                <th>{t('orders.customer')}</th>
                <th>{t('orders.status')}</th>
                <th>الإجمالي</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td><span className={styles.orderId}>#{order.id.slice(-6)}</span></td>
                  <td>
                    <span className={styles.customer}>{order.address.fullName}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                      {order.status === 'pending' && <Clock size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />}
                      {order.status === 'delivered' && <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />}
                      {order.status === 'cancelled' && <AlertCircle size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />}
                      {order.status}
                    </span>
                  </td>
                  <td><span className={styles.amount}>{order.total.toLocaleString()} ر.ي</span></td>
                  <td><span className={styles.date}>{new Date(order.date).toLocaleDateString(locale)}</span></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    لا توجد طلبات بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
