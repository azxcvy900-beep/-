'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Star, 
  Trash2, 
  CheckCircle, 
  User, 
  Package, 
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  getStoreReviews, 
  updateReviewStatus, 
  deleteReview,
  Review 
} from '@/lib/api';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import styles from './reviews.module.css';

export default function MerchantReviews() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  const { data: reviews, loading: reviewsLoading } = useStreamingFetch(
    () => getStoreReviews(storeSlug || 'demo'), [storeSlug]
  );

  const { visibleItems: visibleReviews } = useProgressiveLoad(reviews || [], 3, 150);

  const handleApprove = async (id: string) => {
    try {
      await updateReviewStatus(storeSlug || 'demo', id, true);
    } catch (error) {
      alert("حدث خطأ أثناء الموافقة على التقييم.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;
    try {
      await deleteReview(storeSlug || 'demo', id);
    } catch (error) {
      alert("حدث خطأ أثناء حذف التقييم.");
    }
  };

  return (
    <div className={styles.reviewsPage}>
      <h1 className={styles.title}>إدارة تقييمات العملاء</h1>

      {reviewsLoading && visibleReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>جاري التحميل...</div>
      ) : visibleReviews.length > 0 ? (
        <div className={styles.reviewsList}>
          {visibleReviews.map((review) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.reviewCard}
            >
              <div className={styles.header}>
                <div className={styles.customerInfo}>
                  <div className={styles.avatar}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className={styles.name}>{review.customerName}</h3>
                    <div className={styles.date}>
                      <Calendar size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                      {new Date(review.date).toLocaleDateString(locale)}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className={styles.productInfo}>
                    <Package size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                    {review.productId}
                  </div>
                  <span className={`${styles.statusBadge} ${review.isApproved ? styles.approved : styles.pending}`}>
                    {review.isApproved ? 'منشور' : 'بانتظار المراجعة'}
                  </span>
                </div>
              </div>

              <div className={styles.rating}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={18} fill={s <= review.rating ? "#fbbf24" : "none"} color="#fbbf24" />
                ))}
              </div>

              <div className={styles.comment}>
                {review.comment}
              </div>

              <div className={styles.actions}>
                {!review.isApproved && (
                  <button 
                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                    onClick={() => handleApprove(review.id)}
                  >
                    <CheckCircle size={16} /> الموافقة والنشر
                  </button>
                )}
                <button 
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(review.id)}
                >
                  <Trash2 size={16} /> حذف التقييم
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-paper)', borderRadius: '24px', border: '1px dashed rgba(128,128,128,0.2)' }}>
          <MessageSquare size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)' }}>{!reviewsLoading && "لا توجد تقييمات حالياً."}</p>
        </div>
      )}
    </div>
  );
}
