'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  DollarSign, 
  Tag, 
  CheckCircle, 
  XCircle,
  X,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getStoreCoupons, 
  addCoupon, 
  updateCoupon, 
  deleteCoupon,
  Coupon 
} from '@/lib/api';
import styles from './coupons.module.css';

export default function MerchantCoupons() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '',
    minOrderAmount: '',
    expiryDate: '',
    usageLimit: '',
    storeSlug: 'demo'
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      const data = await getStoreCoupons('demo');
      setCoupons(data);
    } catch (error) {
      console.error("Error loading coupons:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateCoupon('demo', id, { isActive: !currentStatus });
      await loadCoupons();
    } catch (error) {
      alert("حدث خطأ أثناء تحديث حالة الكوبون.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;
    try {
      await deleteCoupon('demo', id);
      await loadCoupons();
    } catch (error) {
      alert("حدث خطأ أثناء حذف الكوبون.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addCoupon({
        ...formData,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      });
      await loadCoupons();
      setIsModalOpen(false);
      setFormData({
        code: '',
        type: 'percent',
        value: '',
        minOrderAmount: '',
        expiryDate: '',
        usageLimit: '',
        storeSlug: 'demo'
      });
    } catch (error) {
      alert("حدث خطأ أثناء إضافة الكوبون.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.couponsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة الكوبونات</h1>
        <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> إضافة كوبون جديد
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>جاري التحميل...</div>
      ) : coupons.length > 0 ? (
        <div className={styles.couponsGrid}>
          {coupons.map((coupon) => (
            <motion.div 
              key={coupon.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.couponCard}
            >
              <div className={`${styles.badge} ${coupon.isActive ? styles.active : styles.inactive}`}>
                {coupon.isActive ? <CheckCircle size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> : <XCircle size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />}
                {coupon.isActive ? 'نشط' : 'متوقف'}
              </div>

              <div className={styles.mainInfo}>
                <div className={styles.code}>{coupon.code}</div>
                <div className={styles.discount}>
                  {coupon.type === 'percent' ? `خصم ${coupon.value}%` : `خصم بقيمة ${coupon.value.toLocaleString()} ر.ي`}
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <span>تاريخ الانتهاء</span>
                  <span className={styles.detailVal}>
                    {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString(locale) : 'لا ينتهي'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span>الاستخدام</span>
                  <span className={styles.detailVal}>{coupon.usageCount} / {coupon.usageLimit || '∞'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span>الحد الأدنى</span>
                  <span className={styles.detailVal}>{coupon.minOrderAmount?.toLocaleString() || 0} ر.ي</span>
                </div>
                <div className={styles.detailItem}>
                  <span>النوع</span>
                  <span className={styles.detailVal}>{coupon.type === 'percent' ? 'نسبة مئوية' : 'مبلغ ثابت'}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <button 
                  className={styles.actionBtn} 
                  onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                  title={coupon.isActive ? "تعطيل" : "تفعيل"}
                  style={{ background: coupon.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: coupon.isActive ? '#ef4444' : '#10b981' }}
                >
                  {coupon.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                </button>
                <button 
                  className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                  onClick={() => handleDelete(coupon.id)}
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-paper)', borderRadius: '24px', border: '1px dashed rgba(128,128,128,0.2)' }}>
          <Tag size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)' }}>لا توجد كوبونات فعالة حالياً. ابدأ بإنشاء أول عرض لزبائنك!</p>
        </div>
      )}

      {/* Add Coupon Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={styles.modal} 
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>إضافة كوبون جديد</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>كود الكوبون (باللغة الإنجليزية)</label>
                  <input 
                    className={styles.input}
                    placeholder="مثال: SAVE20"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    required
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>نوع الخصم</label>
                    <select 
                      className={styles.input}
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option value="percent">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (ر.ي)</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>القيمة</label>
                    <input 
                      type="number"
                      className={styles.input}
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>الحد الأدنى للطلب</label>
                    <input 
                      type="number"
                      className={styles.input}
                      placeholder="0"
                      value={formData.minOrderAmount}
                      onChange={e => setFormData({...formData, minOrderAmount: e.target.value})}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>حد الاستخدام</label>
                    <input 
                      type="number"
                      className={styles.input}
                      placeholder="لا محدود"
                      value={formData.usageLimit}
                      onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>تاريخ الانتهاء</label>
                  <input 
                    type="date"
                    className={styles.input}
                    value={formData.expiryDate}
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>

                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الكوبون'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
