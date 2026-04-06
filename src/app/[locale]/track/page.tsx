'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import BackButton from '@/components/shared/BackButton/BackButton';
import styles from './track.module.css';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

const STATUS_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export default function TrackOrderPage() {
  const t = useTranslations('Tracking');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string, status: OrderStatus, date: string } | null>(null);
  const [error, setError] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(false);
    setResult(null);

    // MOCK TRACKING LOGIC
    // Any ID starting with OD- is "found"
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (orderId.toUpperCase().startsWith('OD-')) {
      // Deterministic status based on ID length or just pick one
      const statusIdx = Math.min(orderId.length % 4, 3);
      setResult({
        id: orderId.toUpperCase(),
        status: STATUS_STEPS[statusIdx] as OrderStatus,
        date: new Date().toLocaleDateString()
      });
    } else {
      setError(true);
    }
    setLoading(false);
  };

  const currentStepIdx = result ? STATUS_STEPS.indexOf(result.status) : -1;

  return (
    <div className={styles.container}>
      <BackButton />
      
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.header}>
          <Package className={styles.headerIcon} size={40} />
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>

        <form onSubmit={handleTrack} className={styles.form}>
          <div className={styles.inputGroup}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={t('placeholder')}
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '...' : t('button')}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              className={styles.error}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={20} />
              <p>{t('errorNotFound')}</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              className={styles.result}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.orderMeta}>
                <div>
                  <span className={styles.metaLabel}>{t('orderId')}</span>
                  <span className={styles.metaValue}>{result.id}</span>
                </div>
                <div>
                  <span className={styles.metaLabel}>{t('date')}</span>
                  <span className={styles.metaValue}>{result.date}</span>
                </div>
              </div>

              <div className={styles.stepper}>
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  
                  return (
                    <div key={step} className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.active : ''}`}>
                      <div className={styles.stepIconWrapper}>
                        {step === 'pending' && <Clock size={20} />}
                        {step === 'processing' && <Package size={20} />}
                        {step === 'shipped' && <Truck size={20} />}
                        {step === 'delivered' && <CheckCircle size={20} />}
                      </div>
                      <div className={styles.stepLabel}>{t(`status.${step}`)}</div>
                      {idx < STATUS_STEPS.length - 1 && <div className={styles.line} />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
