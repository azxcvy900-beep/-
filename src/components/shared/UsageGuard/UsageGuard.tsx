'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import styles from './UsageGuard.module.css';

interface UsageGuardProps {
  children: React.ReactNode;
  isLocked: boolean;
  orderCount: number;
  plan: string;
}

export default function UsageGuard({ children, isLocked, orderCount, plan }: UsageGuardProps) {
  const locale = useLocale();

  if (isLocked && plan === 'free') {
    return (
      <div className={styles.lockContainer}>
        {/* Blurry version of potential children behind */}
        <div className={styles.blurredContent}>
           {children}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.lockOverlay}
        >
          <div className={styles.lockCard}>
            <div className={styles.iconBox}>
              <Lock size={32} />
            </div>
            <h2>تجاوزت الحد المسموح ⚠️</h2>
            <p>لقد وصلت إلى <strong>{orderCount} طلب</strong> في الباقة المجانية. يرجى الترقية لمشاهدة إيصالات الدفع ومعالجة الطلبات.</p>
            
            <Link href="/admin/billing" className={styles.upgradeBtn}>
              <Crown size={20} /> ترقية الحساب الآن
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {plan === 'free' && orderCount >= 9 && orderCount < 15 && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className={styles.warningBanner}
        >
          <AlertCircle size={18} />
          <span>تنبيه: لقد استهلكت {orderCount}/10 من طلباتك المجانية. قارب حسابك على الانغلاق!</span>
          <Link href="/admin/billing">اشترك الآن</Link>
        </motion.div>
      )}
      {children}
    </>
  );
}
