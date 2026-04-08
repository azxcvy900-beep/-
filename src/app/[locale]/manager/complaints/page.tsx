'use client';

import React, { useEffect, useState } from 'react';
import { 
  MessageSquareWarning, 
  Search, 
  Filter, 
  AlertCircle,
  ThumbsDown,
  ChevronDown,
  MessageCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllPlatformReviews, Review } from '@/lib/api';
import styles from './complaints.module.css';

export default function ComplaintsCenter() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical'>('all');

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await getAllPlatformReviews();
        setReviews(data);
      } catch (error) {
        console.error("Error loading platform reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  const filteredReviews = reviews.filter(r => {
    if (selectedFilter === 'critical') return r.rating <= 2;
    return true;
  });

  if (loading) return <div className={styles.loading}>جاري فحص بلاغات المنصة...</div>;

  return (
    <div className={styles.complaintsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1>مركز بلاغات وطلبات دعم العملاء</h1>
          <p>رصد المراجعات السلبية والشكاوى عبر كافة المتاجر للتدخل السريع.</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statMini}>
            <span>إجمالي البلاغات</span>
            <strong>{reviews.length}</strong>
          </div>
          <div className={styles.statMini}>
            <span>بلاغات حرجة 🔴</span>
            <strong>{reviews.filter(r => r.rating <= 2).length}</strong>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterTabs}>
          <button 
            className={selectedFilter === 'all' ? styles.activeTab : ''} 
            onClick={() => setSelectedFilter('all')}
          >
            كافة المراجعات
          </button>
          <button 
            className={selectedFilter === 'critical' ? styles.activeTab : ''} 
            onClick={() => setSelectedFilter('critical')}
          >
            بلاغات حرجة (2 نجمة أو أقل)
          </button>
        </div>
      </div>

      <div className={styles.complaintGrid}>
        {filteredReviews.length > 0 ? (
          filteredReviews.map((r, i) => (
            <motion.div 
              key={r.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={styles.complaintCard}
            >
              <div className={styles.cardHeader}>
                <div className={styles.customerInfo}>
                   <div className={styles.avatar}>{r.customerName.charAt(0)}</div>
                   <div>
                     <h4>{r.customerName}</h4>
                     <small>ضد متجر: <strong>{r.storeSlug}</strong></small>
                   </div>
                </div>
                <div className={`${styles.ratingBadge} ${r.rating <= 2 ? styles.critical : ''}`}>
                  {r.rating} / 5
                </div>
              </div>

              <div className={styles.cardBody}>
                <MessageSquareWarning size={18} className={styles.quoteIcon} />
                <p>{r.comment}</p>
              </div>

              <div className={styles.cardFooter}>
                 <div className={styles.meta}>
                   <Clock size={14} />
                   {new Date(r.date).toLocaleDateString('ar-YE')}
                 </div>
                 <div className={styles.actions}>
                    <button className={styles.actionBtn}>معالجة البلاغ</button>
                    <button className={styles.actionBtnSecondary}><ExternalLink size={14} /></button>
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={styles.empty}>لا توجد بلاغات حالية. المنصة تعمل بكفاءة عالية ✅</div>
        )}
      </div>
    </div>
  );
}
