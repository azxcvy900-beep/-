'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { CheckCircle, Home, ShoppingBag, ArrowRight } from 'lucide-react';
import styles from './success.module.css';

export default function OrderSuccessPage() {
  const t = useTranslations('Success');
  const locale = useLocale();
  const { orders } = useCartStore();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (orders.length > 0) {
      setOrderNumber(orders[0].id);
    } else {
      // Fallback in case store is cleared
      const num = Math.floor(100000 + Math.random() * 900000);
      setOrderNumber(`ORD-${num}`);
    }
  }, [orders]);

  return (
    <div className={styles.container}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
        className={styles.card}
      >
        <div className={styles.iconWrapper}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle size={80} className={styles.successIcon} />
          </motion.div>
        </div>

        <h1 className={styles.title}>{t('thankYou')}</h1>
        <p className={styles.subtitle}>{t('orderReceived')}</p>
        
        <div className={styles.orderInfo}>
          <p>{t('orderNumber')}: <strong>{orderNumber}</strong></p>
          <p className={styles.statusNote}>{t('statusPending')}</p>
        </div>

        <div className={styles.instructions}>
          <h3>{t('nextSteps')}</h3>
          <ul>
            <li>{t('step1')}</li>
            <li>{t('step2')}</li>
            <li>{t('step3')}</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Link href={`/${locale}`} className={styles.primaryBtn}>
            <Home size={20} />
            {t('backToHome')}
          </Link>
          <Link href={`/${locale}`} className={styles.secondaryBtn}>
            {t('browseMore')}
            <ArrowRight size={20} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
