'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { CheckCircle, Home, MessageCircle, ArrowRight } from 'lucide-react';
import { getStoreInfo, StoreInfo } from '@/lib/api';
import { getMerchantWhatsAppUrl } from '@/lib/whatsapp';
import styles from './success.module.css';

export default function OrderSuccessPage() {
  const t = useTranslations('Success');
  const locale = useLocale();
  const { orders } = useCartStore();
  const [orderNumber, setOrderNumber] = useState('');
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    async function init() {
      // Load store info - using 'demo' as fallback, 
      // but ideally we should track which store the order belongs to
      try {
        const info = await getStoreInfo('demo');
        setStoreInfo(info);
      } catch (e) {
        console.error(e);
      }

      if (orders.length > 0) {
        setOrderNumber(orders[0].id);
      } else {
        const num = Math.floor(100000 + Math.random() * 900000);
        setOrderNumber(`ORD-${num}`);
      }
    }
    init();
  }, [orders]);

  const handleSendWhatsApp = () => {
    if (orders.length > 0 && storeInfo) {
      const url = getMerchantWhatsAppUrl(orders[0], storeInfo);
      window.open(url, '_blank');
    }
  };

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

        {orders.length > 0 && orders[0].paymentMethod === 'bank_transfer' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={styles.whatsappPrompt}
          >
            <p>يرجى إرسال صورة سند الحوالة لتأكيد طلبك وتجميد السعر فوراً:</p>
            <button onClick={handleSendWhatsApp} className={styles.whatsappBtn}>
              <MessageCircle size={20} />
              إرسال السند عبر واتساب
            </button>
          </motion.div>
        )}

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
