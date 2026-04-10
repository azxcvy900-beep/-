'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Percent, 
  DollarSign,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getStoreInfo, 
  addCoupon, 
  deleteCoupon, 
  Coupon 
} from '@/lib/api';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '@/lib/auth-store';
import { TableSkeleton } from '@/components/shared/Skeletons/Skeletons';
import styles from './coupons.module.css';

export default function MerchantCoupons() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [planType, setPlanType] = useState<'free' | 'pro' | 'business'>('free');
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 10,
    minOrderAmount: 0,
    expiryDate: '',
    usageLimit: 100
  });

  useEffect(() => {
    if (!storeSlug) return;
    
    // 1. Fetch Plan Type
    getStoreInfo(storeSlug).then(info => {
      if (info) setPlanType(info.planType || 'free');
    });

    // 2. Real-time Coupons Listener
    const couponsRef = collection(db, 'stores', storeSlug, 'coupons');
    const q = query(couponsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as Coupon);
      setCoupons(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeSlug]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug || planType === 'free') return;

    try {
      await addCoupon({
        ...formData,
        code: formData.code.toUpperCase(),
        storeSlug
      });
      setIsAdding(false);
      setFormData({ code: '', type: 'percent', value: 10, minOrderAmount: 0, expiryDate: '', usageLimit: 100 });
    } catch (error) {
      alert("حدث خطأ أثناء إضافة الكوبون");
    }
  };

  const handleDelete = async (id: string) => {
    if (!storeSlug || !confirm("هل تريد حذف هذا الكوبون؟")) return;
    await deleteCoupon(storeSlug, id);
  };

  if (planType === 'free') {
    return (
      <div className={styles.lockedContainer}>
        <div className={styles.lockedCard}>
          <Ticket size={64} className={styles.lockedIcon} />
          <h2>نظام الكوبونات (برو) 🎫</h2>
          <p>أطلق حملاتك التسويقية وزد مبيعاتك عبر أكواد الخصم المخصصة. هذه الميزة متاحة فقط لأصحاب الباقات المدفوعة.</p>
          <button onClick={() => window.location.href = `/${locale}/admin/billing`} className={styles.upgradeBtn}>
             ترقية الحساب الآن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.couponsPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>إدارة الكوبونات 🎫</h1>
          <p className={styles.subtitle}>أنشئ أكواد خصم مخصصة لجذب المزيد من الزبائن.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
          <Plus size={20} /> كوبون جديد
        </button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : coupons && coupons.length > 0 ? (
          <div className={styles.grid}>
            {coupons.map((coupon) => (
              <motion.div 
                key={coupon.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.couponCard}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.codeBadge}>{coupon.code}</div>
                  <button onClick={() => handleDelete(coupon.id)} className={styles.deleteBtn}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.valueRow}>
                    {coupon.type === 'percent' ? <Percent size={24} /> : <DollarSign size={24} />}
                    <span className={styles.value}>{coupon.value}{coupon.type === 'percent' ? '%' : ''}</span>
                  </div>
                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>الاستخدام</span>
                      <span className={styles.statVal}>{coupon.usageCount} / {coupon.usageLimit}</span>
                    </div>
                    {coupon.expiryDate && (
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>ينتهي في</span>
                        <span className={styles.statVal}>{new Date(coupon.expiryDate).toLocaleDateString(locale)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Ticket size={48} />
            <p>لا يوجد كوبونات فعالة حالياً. ابدأ بإضافة أول كوبون!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={styles.modal}
            >
              <div className={styles.modalHeader}>
                <h3>إضافة كوبون جديد</h3>
                <button onClick={() => setIsAdding(false)}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>
              <form onSubmit={handleAdd} className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>كود الخصم (مثل: SAVE20)</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                    placeholder="SAVE20"
                  />
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>نوع الخصم</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                      <option value="percent">نسبة مئوية (%)</option>
                      <option value="fixed">قيمة ثابتة (YER)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>القيمة</label>
                    <input type="number" required value={formData.value} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>أقل قيمة طلب (اختياري)</label>
                    <input type="number" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: parseFloat(e.target.value)})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>أقصى عدد مرات استخدام</label>
                    <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>تاريخ الانتهاء</label>
                  <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
                <button type="submit" className={styles.submitBtn}>تفعيل الكوبون</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
