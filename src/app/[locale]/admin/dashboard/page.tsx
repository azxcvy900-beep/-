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
  ArrowDownRight,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';
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

  // Analytics Logic
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const lowStockThreshold = 5;
  const lowStockCount = products.filter(p => p.stockCount > 0 && p.stockCount <= lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stockCount === 0).length;

  // Calculate top products
  const productSalesMap: Record<string, { count: number, name: string, price: number, image: string }> = {};
  orders.forEach(order => {
    if (order.status !== 'cancelled') {
      order.items.forEach(item => {
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = { count: 0, name: item.name, price: item.price, image: item.image };
        }
        productSalesMap[item.id].count += item.quantity;
      });
    }
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Stats Data
  const stats = [
    { 
      label: t('dashboard.totalSales'), 
      value: `${totalSales.toLocaleString()} ر.ي`, 
      subValue: '+12% عن الشهر الماضي',
      icon: TrendingUp, 
      color: '#10b981'
    },
    { 
      label: 'طلبات جديدة', 
      value: pendingOrdersCount, 
      subValue: 'تحتاج معالجة',
      icon: ShoppingBag, 
      color: '#3b82f6'
    },
    { 
      label: 'مخزون منخفض', 
      value: lowStockCount + outOfStockCount, 
      subValue: `${outOfStockCount} نفدت تماماً`,
      icon: AlertCircle, 
      color: '#f59e0b'
    },
    { 
      label: 'إجمالي العملاء', 
      value: new Set(orders.map(o => o.address.phone)).size, 
      subValue: 'عملاء مميزون',
      icon: Users, 
      color: '#8b5cf6'
    },
  ];

  if (loading) {
    return <div className={styles.loading}>جاري تجهيز لوحة التحكم...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.dashboard}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>مرحباً بك في لوحة الإدارة 🚀</h1>
          <p className={styles.subtitle}>أداء متجرك في لمح البصر</p>
        </div>
      </div>

      <div className={styles.statGrid}>
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -5 }}
            className={styles.statCard}
          >
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>{stat.label}</p>
              <h2 className={styles.statValue}>{stat.value}</h2>
              <p className={styles.statSub}>{stat.subValue}</p>
            </div>
            <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={28} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        {/* Sales Chart Section */}
        <div className={styles.chartSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>أداء المبيعات (الأسبوعي)</h3>
          </div>
          <div className={styles.chartContainer}>
            {/* Custom SVG Chart */}
            <svg viewBox="0 0 400 150" className={styles.svgChart}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M0,120 Q50,110 100,50 T200,80 T300,20 T400,60 L400,150 L0,150 Z" 
                fill="url(#chartGradient)"
              />
              <path 
                d="M0,120 Q50,110 100,50 T200,80 T300,20 T400,60" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Data points */}
              {[100, 200, 300, 400].map(x => (
                <circle key={x} cx={x} cy={60} r="4" fill="#3b82f6" fillOpacity="0.5" />
              ))}
            </svg>
            <div className={styles.chartLabels}>
              <span>السبت</span>
              <span>الأحد</span>
              <span>الاثنين</span>
              <span>الثلاثاء</span>
              <span>الأربعاء</span>
              <span>الخميس</span>
              <span>الجمعة</span>
            </div>
          </div>
        </div>

        {/* Top Products Section */}
        <div className={styles.topProducts}>
          <h3 className={styles.sectionTitle}>المنتجات الأكثر مبيعاً 🏆</h3>
          <div className={styles.productList}>
            {topProducts.map((p, i) => (
              <div key={i} className={styles.productItem}>
                <div className={styles.prodImg}>
                  <img src={p.image} alt={p.name} />
                </div>
                <div className={styles.prodInfo}>
                  <h4>{p.name}</h4>
                  <p>{p.count} مبيعات</p>
                </div>
                <div className={styles.prodPrice}>
                  {(p.price * p.count).toLocaleString()} ر.ي
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className={styles.empty}>لا توجد مبيعات بعد</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>أحدث الطلبات القادمة 📦</h3>
          <Link href={`/${locale}/admin/orders`} className={styles.viewAll}>
            إدارة كافة الطلبات <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>طريقة الدفع</th>
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
                    <span className={styles.payMethod}>
                      {order.paymentMethod === 'electronic' ? 'بطاقة 💳' : 'حوالة 💸'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                      {order.status === 'pending' && <Clock size={12} />}
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
