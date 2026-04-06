'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoreOrders, updateOrderStatus } from '@/lib/api';
import { Order } from '@/lib/store';
import styles from './orders.module.css';

export default function MerchantOrders() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await getStoreOrders('demo');
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (error) {
      alert("حدث خطأ أثناء تحديث حالة الطلب.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock size={18} />;
      case 'processing': return <Package size={18} />;
      case 'shipped': return <Truck size={18} />;
      case 'delivered': return <CheckCircle2 size={18} />;
      case 'cancelled': return <XCircle size={18} />;
      default: return null;
    }
  };

  const statusOptions: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className={styles.ordersPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('orders.title')}</h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          إجمالي الطلبات: {orders.length}
        </div>
      </div>

      <div className={styles.listSection}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>جاري تحميل الطلبات...</div>
        ) : orders.length > 0 ? (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.orderCard}
              >
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderId}>#{order.id.slice(-8)}</span>
                    <span className={styles.orderDate}>{new Date(order.date).toLocaleString(locale)}</span>
                  </div>
                  <div className={`${styles.statusBadge} ${styles[order.status]}`}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </div>
                </div>

                <div className={styles.orderContent}>
                  <div className={styles.customerSection}>
                    <h4><User size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> بيانات العميل</h4>
                    <div className={styles.customerInfo}>
                      <p>{order.address.fullName}</p>
                      <span>{order.address.phone}</span>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} />
                        <span>{order.address.city}, {order.address.region}, {order.address.details}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemsSection}>
                    <h4><Package size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> المنتجات ({order.items.length})</h4>
                    <div className={styles.itemList}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.itemLine}>
                          <span className={styles.itemName}>
                            {item.quantity}x {item.name}
                            {item.selectedOptions && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                              </div>
                            )}
                          </span>
                          <span className={styles.itemTotal}>{(item.price * item.quantity).toLocaleString()} ر.ي</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.paymentSection}>
                    <h4><CreditCard size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> سند الدفع</h4>
                    {order.paymentProof ? (
                      <div className={styles.paymentReceipt} onClick={() => window.open(order.paymentProof, '_blank')}>
                        <img src={order.paymentProof} alt="Receipt" />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '1rem', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                        لا يوجد سند مرفق.
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.totalArea}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>الإجمالي النهائي:</span>
                    <div className={styles.totalPrice}>{order.total.toLocaleString()} ر.ي</div>
                  </div>

                  <div className={styles.actions}>
                    <select 
                      className={styles.statusDropdown}
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <button className={styles.updateBtn} disabled={updatingId === order.id}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            لا توجد طلبات واردة حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
