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
  AlertCircle,
  Users,
  Wallet,
  Lock,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoreOrders, getStoreProducts, Product, getStoreInfo, StoreInfo } from '@/lib/api';
import { Order } from '@/lib/store';
import styles from './dashboard.module.css';

export default function MerchantDashboard() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersData, productsData, infoData] = await Promise.all([
          getStoreOrders('demo'),
          getStoreProducts('demo'),
          getStoreInfo('demo')
        ]);
        setOrders(ordersData);
        setProducts(productsData);
        setStoreInfo(infoData);
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Analytic Calculations
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const totalSalesYER = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const sarRate = storeInfo?.currencySettings?.rates?.SAR || 140;
  const totalSalesSAR = totalSalesYER / sarRate;

  const lockedOrders = activeOrders.filter(o => o.status === 'pending' || o.isPriceLocked);
  const lockedFundsYER = lockedOrders.reduce((sum, order) => sum + order.total, 0);
  
  const confirmedOrders = activeOrders.filter(o => o.status === 'delivered');
  const confirmedFundsYER = confirmedOrders.reduce((sum, order) => sum + order.total, 0);

  const lowStockThreshold = 5;
  const lowStockProducts = products.filter(p => p.stockCount > 0 && p.stockCount <= lowStockThreshold);
  const outOfStockCount = products.filter(p => p.stockCount === 0).length;

  const stats = [
    { 
      label: 'إجمالي المبيعات (YER)', 
      value: `${totalSalesYER.toLocaleString()} ر.ي`, 
      subValue: `~${totalSalesSAR.toLocaleString(undefined, { maximumFractionDigits: 0 })} ر.س`,
      icon: TrendingUp, 
      color: '#10b981'
    },
    { 
      label: 'مبالغ مجمّدة', 
      value: `${lockedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'بانتظار تأكيد الحوالات',
      icon: Lock, 
      color: '#f59e0b'
    },
    { 
      label: 'مبالغ مؤكدة', 
      value: `${confirmedFundsYER.toLocaleString()} ر.ي`, 
      subValue: 'تم التأكد والتحصيل',
      icon: CheckCircle2, 
      color: '#3b82f6'
    },
    { 
      label: 'تحتاج تنبيه', 
      value: lowStockProducts.length + outOfStockCount, 
      subValue: `${outOfStockCount} نفدت تماماً`,
      icon: AlertCircle, 
      color: '#ef4444'
    },
  ];

  if (loading) {
    return <div className={styles.loadingContainer}>جاري تحميل التحليلات...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.dashboard}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>لوحة تحكم التاجر 🚀</h1>
          <p className={styles.subtitle}>أداء {storeInfo?.name || 'متجر بايرز'} في لمح البصر</p>
        </div>
        <Link href={`/${locale}/admin/wallet`} className={styles.walletLink}>
          <Wallet size={18} /> المحفظة
        </Link>
      </div>

      <div className={styles.statGrid}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>{stat.label}</p>
              <h2 className={styles.statValue}>{stat.value}</h2>
              <p className={styles.statSub}>{stat.subValue}</p>
            </div>
            <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={26} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.actionSection}>
          <h3 className={styles.sectionTitle}>تنبيهات المخزون ⚠️</h3>
          <div className={styles.lowStockList}>
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(p => (
                <div key={p.id} className={styles.stockItem}>
                  <img src={p.image} alt={p.name} />
                  <div className={styles.stockInfo}>
                    <h4>{p.name}</h4>
                    <p>المتبقي: <span className={styles.warningText}>{p.stockCount} قطع</span></p>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.empty}>جميع المنتجات متوفرة بكثرة ✅</p>
            )}
          </div>
        </div>

        <div className={styles.topProducts}>
          <h3 className={styles.sectionTitle}>مبالغ بانتظار التأكيد 💰</h3>
          <div className={styles.productList}>
            {lockedOrders.slice(0, 5).map((order) => (
              <div key={order.id} className={styles.productItem}>
                <div className={styles.prodInfo}>
                  <h4>#{order.id.slice(-6)}</h4>
                  <p>{order.address.fullName}</p>
                </div>
                <div className={styles.prodPrice}>
                  {order.total.toLocaleString()} ر.ي
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>أحدث الطلبات القادمة 📦</h3>
          <Link href={`/${locale}/admin/orders`} className={styles.viewAll}>
            إدارة كافة الطلبات <ChevronLeft size={16} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
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
              {orders.slice(0, 6).map((order) => (
                <tr key={order.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
