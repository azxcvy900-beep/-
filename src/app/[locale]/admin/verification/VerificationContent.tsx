'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Upload, 
  Camera, 
  FileText, 
  Landmark, 
  Phone, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  X,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { uploadKYCDoc, submitKYC } from '@/lib/api';
import { useSessionStore } from '@/lib/session-store';
import styles from './verification.module.css';

export default function VerificationContent() {
  const t = useTranslations('Admin');
  const { storeSlug } = useSessionStore();
  const { storeName, storeLogo, verificationStatus, rejectionReason, setStoreInfo } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [utilityFile, setUtilityFile] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState('');
  const [utilityPreview, setUtilityPreview] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'identity' | 'utility') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'identity') {
        setIdentityFile(file);
        setIdentityPreview(URL.createObjectURL(file));
      } else {
        setUtilityFile(file);
        setUtilityPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug) return;
    if (!identityFile || !utilityFile) {
      setError('يرجى رفع كافة الوثائق المطلوبة أولاً.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload documents
      const identityUrl = await uploadKYCDoc(identityFile, storeSlug, 'identity');
      const utilityBillUrl = await uploadKYCDoc(utilityFile, storeSlug, 'utility');

      // 2. Submit KYC Request
      await submitKYC(storeSlug, {
        storeSlug,
        phone,
        bankAccount,
        identityUrl,
        utilityBillUrl
      });

      // Update local state to immediately reflect the change and show success UI
      setStoreInfo({
        slug: storeSlug,
        name: storeName || '',
        logo: storeLogo || '',
        verificationStatus: 'under_review',
        rejectionReason: null,
      } as any);
      
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء رفع البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus === 'under_review') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.underReview}>
            <Clock size={80} className={styles.statusIcon} />
            <h2 className={styles.statusTitle}>طلبك قيد المراجعة حالياً</h2>
            <p className={styles.statusDesc}>
              لقد استلمنا وثائقك بنجاح. يقوم فريق "بايرز" حالياً بمراجعة البيانات للتأكد من مطابقتها للمعايير. 
              ستصلك النتيجة خلال 48 ساعة كحد أقصى.
            </p>
            <div style={{ marginTop: '1rem', color: '#3b82f6', fontWeight: 600 }}>
              يمكنك الاستمرار في تجهيز منتجاتك وإعدادات متجرك في هذه الأثناء.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'active') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.underReview}>
            <CheckCircle2 size={80} color="#10b981" />
            <h2 className={styles.statusTitle}>متجرك نشط ومفعل!</h2>
            <p className={styles.statusDesc}>
              تهانينا! متجرك الآن مفعل للجمهور ويمكن للعملاء البدء في شراء منتجاتك. 
              نتمنى لك تجارة رابحة وموفقة.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {verificationStatus === 'rejected' && (
        <div className={styles.rejectionCard}>
          <AlertCircle size={24} color="#dc2626" />
          <div className={styles.rejectionInfo}>
            <h4>تم رفض التحقق السابق</h4>
            <p>{rejectionReason || 'يرجى مراجعة البيانات المرفوعة والتأكد من وضوح الصور.'}</p>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <header className={styles.header}>
          <ShieldCheck size={48} className={styles.headerIcon} />
          <h2 className={styles.title}>تفعيل المتجر (الهوية التجارية)</h2>
          <p className={styles.subtitle}>
            لضمان أمان المعاملات وبناء الثقة مع عملائك، نحتاج لتأكيد هويتك كتاجر رسمي على المنصة.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3><Phone size={18} /> بيانات التواصل</h3>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>رقم الجوال (للتواصل الرسمي)</label>
            <input 
              type="tel" 
              className={styles.input}
              placeholder="مثال: 967xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>رقم الحساب البنكي / المحفظة</label>
            <input 
              type="text" 
              className={styles.input}
              placeholder="رقم الحساب لاستلام المبيعات"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              required
            />
          </div>

          <div className={styles.section}>
            <h3><ImageIcon size={18} /> الوثائق الثبوتية</h3>
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>صورة الهوية / جواز السفر</label>
            <label className={styles.uploadArea}>
              <input 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'identity')}
              />
              {!identityPreview ? (
                <>
                  <Camera size={32} className={styles.uploadIcon} />
                  <span className={styles.uploadLabel}>اضغط لرفع صورة واضحة للهوية</span>
                </>
              ) : (
                <div className={styles.preview}>
                  <img src={identityPreview} alt="Identity Preview" />
                  <button type="button" className={styles.removePreview} onClick={() => { setIdentityFile(null); setIdentityPreview(''); }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </label>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>فاتورة كهرباء / ماء / عقد إيجار</label>
            <label className={styles.uploadArea}>
              <input 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'utility')}
              />
              {!utilityPreview ? (
                <>
                  <FileText size={32} className={styles.uploadIcon} />
                  <span className={styles.uploadLabel}>إثبات عنوان السكن أو المحل</span>
                </>
              ) : (
                <div className={styles.preview}>
                  <img src={utilityPreview} alt="Utility Preview" />
                  <button type="button" className={styles.removePreview} onClick={() => { setUtilityFile(null); setUtilityPreview(''); }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </label>
          </div>

          <div className={styles.footer}>
            {error && <div style={{ color: '#dc2626', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                'جاري الرفع والمعالجة...'
              ) : (
                <>
                  <ShieldCheck size={20} />
                  إرسال طلب التفعيل والمراجعة
                </>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
              بضغطك على إرسال، أنت تقر بصحة البيانات المرفوعة وبأنها تخصك شخصياً.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
