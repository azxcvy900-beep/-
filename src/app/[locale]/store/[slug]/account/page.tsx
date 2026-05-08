'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ShoppingBag, 
  LogOut, 
  Package, 
  ChevronRight, 
  Calendar, 
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { useCustomerSessionStore } from '@/lib/customer-session-store';
import { getCustomerOrders, Order } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import styles from './account.module.css';

export default function CustomerAccountPage() {
  const locale = useLocale();
  const { slug } = useParams();
  const router = useRouter();
  const { isLoggedIn, email, username, uid, logout, _hasHydrated } = useCustomerSessionStore();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) {
      router.push(`/${locale}/store/${slug}/login`);
    }
  }, [_hasHydrated, isLoggedIn, locale, slug, router]);

  useEffect(() => {
    async function loadOrders() {
      if (email) {
        try {
          const data = await getCustomerOrders(email, uid || undefined);
          setOrders(data);
        } catch (error) {
          console.error("Failed to load orders:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    if (isLoggedIn) {
      loadOrders();
    }
  }, [isLoggedIn, email]);

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج');
    router.push(`/${locale}/store/${slug}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} color="#10b981" />;
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'cancelled': return <XCircle size={16} color="#ef4444" />;
      default: return <Package size={16} color="#3b82f6" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'تم التوصيل';
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'جاري التنفيذ';
      case 'shipped': return 'تم الشحن';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  if (!_hasHydrated || loading) {
    return <div className={styles.loadingContainer}><Loader2 className={styles.spin} size={48} /></div>;
  }

  return (
    <div className={styles.accountPage}>
      <div className={styles.container}>
        {/* Profile Header */}
        <section className={styles.profileCard}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>
              <User size={40} />
            </div>
            <div>
              <h2>{username}</h2>
              <p>{email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </section>

        {/* Orders Section */}
        <section className={styles.ordersSection}>
          <div className={styles.sectionHeader}>
            <ShoppingBag size={24} />
            <h3>طلباتي السابقة</h3>
          </div>

          <div className={styles.ordersList}>
            {orders.length === 0 ? (
              <div className={styles.emptyOrders}>
                <Package size={48} />
                <p>لا يوجد لديك طلبات سابقة حتى الآن</p>
                <Link href={`/${locale}/store/${slug}`} className={styles.shopBtn}>
                  ابدأ التسوق الآن
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <motion.div 
                  key={order.id}
                  className={styles.orderCard}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className={styles.orderHeader}>
                    <span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span>
                    <div className={styles.statusBadge} data-status={order.status}>
                      {getStatusIcon(order.status)}
                      <span>{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.orderDetails}>
                    <div className={styles.detailItem}>
                      <Calendar size={14} />
                      <span>{new Date(order.date).toLocaleDateString(locale === 'ar' ? 'ar-YE' : 'en-US')}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <CreditCard size={14} />
                      <span>{order.total} {order.currency}</span>
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className={styles.itemThumb}>
                        <img src={item.image} alt={item.name} />
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className={styles.moreItems}>+{order.items.length - 2}</div>
                    )}
                  </div>

                  <Link href={`/${locale}/track?id=${order.id}`} className={styles.trackBtn}>
                    <span>تتبع الطلب</span>
                    <ChevronRight size={16} />
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
