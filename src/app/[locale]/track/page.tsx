'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, Calendar, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { getOrderById, Order } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';
import BackButton from '@/components/shared/BackButton/BackButton';
import styles from './track.module.css';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export default function TrackOrderPage() {
  const t = useTranslations('Tracking');
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string, status: OrderStatus, date: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setOrderId(id);
      performTrack(id);
    }
  }, [searchParams]);

  const performTrack = async (id: string) => {
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const order = await getOrderById(id.trim());
      if (order) {
        triggerHaptic('success');
        setResult({
          id: order.id,
          status: order.status,
          date: new Date(order.date).toLocaleDateString()
        });
      } else {
        triggerHaptic('error');
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    performTrack(orderId);
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.orderBadge}>
                <Zap size={14} className={styles.zapIcon} />
                <span>طلب مباشر</span>
              </div>

              <div className={styles.orderHeader}>
                <div className={styles.idSection}>
                  <span className={styles.label}>{t('orderId')}</span>
                  <div className={styles.idWrapper}>
                    <h3>{result.id}</h3>
                    <button className={styles.copyIdBtn} onClick={() => {
                       navigator.clipboard.writeText(result.id);
                       triggerHaptic('medium');
                    }}>نسخ</button>
                  </div>
                </div>
                <div className={styles.dateSection}>
                  <span className={styles.label}>{t('date')}</span>
                  <div className={styles.dateValue}>
                    <Calendar size={16} />
                    <span>{result.date}</span>
                  </div>
                </div>
              </div>

              <div className={styles.timelineContainer}>
                <div className={styles.timelineTrack}>
                  <motion.div 
                    className={styles.timelineProgress}
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>

                <div className={styles.steps}>
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    
                    return (
                      <div key={step} className={`${styles.stepItem} ${isCompleted ? styles.stepCompleted : ''} ${isCurrent ? styles.stepActive : ''}`}>
                        <div className={styles.stepPoint}>
                          <div className={styles.pointInner}>
                            {step === 'pending' && <Clock size={18} />}
                            {step === 'processing' && <Package size={18} />}
                            {step === 'shipped' && <Truck size={18} />}
                            {step === 'delivered' && <CheckCircle size={18} />}
                          </div>
                          {isCompleted && (
                            <motion.div 
                              layoutId="activeGlow"
                              className={styles.pointGlow}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1.2, opacity: 0.4 }}
                            />
                          )}
                        </div>
                        <div className={styles.stepInfo}>
                          <span className={styles.stepTitle}>{t(`status.${step}`)}</span>
                          <span className={styles.stepDesc}>
                            {isCurrent ? 'جاري العمل على طلبك الآن' : isCompleted ? 'اكتملت هذه المرحلة' : 'في انتظار اكتمال المراحل السابقة'}
                          </span>
                        </div>
                        {isCurrent && (
                          <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className={styles.currentIndicator}
                          >
                            <ChevronRight size={16} />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.supportAlert}>
                <div className={styles.supportIcon}><AlertCircle size={20} /></div>
                <div className={styles.supportText}>
                  <p>هل لديك استفسار حول الطلب؟</p>
                  <span>تواصل مع الدعم الفني مباشرة عبر الواتساب</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
