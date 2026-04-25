'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { CheckCircle, Home, MessageCircle, ArrowRight, Zap } from 'lucide-react';
import { getStoreInfo, StoreInfo } from '@/lib/api';
import { getMerchantWhatsAppUrl } from '@/lib/whatsapp';
import styles from './success.module.css';

const ConfettiParticle = ({ delay }: { delay: number }) => {
  const colors = ['#fbbf24', '#f59e0b', '#3b82f6', '#ef4444', '#10b981'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * 100; // random horizontal start
  
  return (
    <motion.div
      initial={{ y: -20, x: `${x}vw`, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ 
        y: '100vh', 
        rotate: 360,
        opacity: 0,
        scale: 0.5
      }}
      transition={{ 
        duration: 2 + Math.random() * 2, 
        delay: delay,
        ease: "linear"
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '10px',
        height: '10px',
        backgroundColor: color,
        borderRadius: '2px',
        zIndex: 50,
        pointerEvents: 'none'
      }}
    />
  );
};

export default function OrderSuccessContent() {
  const t = useTranslations('Success');
  const locale = useLocale();
  const { orders } = useCartStore();
  const [orderNumber, setOrderNumber] = useState('');
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    async function init() {
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
      {/* Confetti Celebration */}
      {Array.from({ length: 40 }).map((_, i) => (
        <ConfettiParticle key={i} delay={Math.random() * 3} />
      ))}
      
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
        </div>

        {/* Tracking Timeline */}
        <div className={styles.timeline}>
          <div className={`${styles.timelineItem} ${styles.active}`}>
            <div className={styles.timelineIcon}><CheckCircle size={16} /></div>
            <span>{t('orderPlaced')}</span>
          </div>
          <div className={styles.timelineLine} />
          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>2</div>
            <span>{t('processing')}</span>
          </div>
          <div className={styles.timelineLine} />
          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>3</div>
            <span>{t('ready')}</span>
          </div>
        </div>

        {orders.length > 0 && orders[0].paymentMethod === 'transfer' && (
          <div className={styles.transferAlert}>
            <div className={styles.alertIcon}><Zap size={24} /></div>
            <div className={styles.alertContent}>
              <h3>{t('actionRequired')}</h3>
              <p>{t('transferNote')}</p>
              <button onClick={handleSendWhatsApp} className={styles.whatsappBtn}>
                <MessageCircle size={20} />
                {t('sendReceipt')}
              </button>
            </div>
          </div>
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
