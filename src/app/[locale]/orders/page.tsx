'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Calendar, Package, RotateCcw, ArrowRight, Trash2, Clock } from 'lucide-react';
import { useCartStore, Order } from '@/lib/store';
import BackButton from '@/components/shared/BackButton/BackButton';
import styles from './orders.module.css';

export default function MyOrdersPage() {
  const t = useTranslations('Orders');
  const pt = useTranslations('Product');
  const locale = useLocale();
  const { orders, addItem, cancelOrder } = useCartStore();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity
      });
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.status_pending;
      case 'processing': return styles.status_processing;
      case 'shipped': return styles.status_shipped;
      case 'delivered': return styles.status_delivered;
      case 'cancelled': return styles.status_cancelled;
      default: return '';
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <BackButton fallbackPath={`/${locale}`} />
      
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.title}
      >
        {t('title')}
      </motion.h1>

      <div className={styles.orderList}>
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={styles.orderCard}
            >
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <h4>{t('orderId')}: {order.id}</h4>
                  <p className={styles.orderDate}>
                    <Clock size={14} style={{ display: 'inline', margin: '0 4px', verticalAlign: 'middle' }} />
                    {new Date(order.date).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                  {t(order.status)}
                </div>
              </div>

              <div className={styles.itemsPreview}>
                {order.items.map((item, idx) => (
                  <div key={`${order.id}-${item.id}-${idx}`} className={styles.itemRow}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQuantity}>× {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className={styles.orderFooter}>
                <div className={styles.totalSection}>
                  <span className={styles.totalLabel}>{t('total')}</span>
                  <span className={styles.totalAmount}>
                    {order.total.toLocaleString()} {pt('currency')}
                  </span>
                </div>
                
                <div className={styles.orderActions}>
                  <button 
                    className={styles.reorderBtn}
                    onClick={() => handleReorder(order)}
                  >
                    <RotateCcw size={16} />
                    {t('reorder')}
                  </button>
                  {order.status === 'pending' && (
                    <button 
                      className={styles.cancelBtn}
                      onClick={() => {
                        if (confirm(t('confirmCancel'))) {
                          cancelOrder(order.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      {t('cancelOrder')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyState}
          >
            <ShoppingBag size={64} color="var(--primary)" style={{ opacity: 0.5 }} />
            <h2>{t('noOrders')}</h2>
            <p>{t('viewStore')}</p>
            <Link href={`/${locale}`} className={styles.shopBtn}>
              {t('viewStore')}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
