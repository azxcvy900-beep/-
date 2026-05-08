'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Target, 
  Zap, 
  Crown, 
  CreditCard, 
  Upload, 
  ShieldCheck, 
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/auth-store';
import { useStreamingFetch } from '@/lib/hooks';
import { getStoreInfo, submitPaymentProof, getPlatformSettings } from '@/lib/api';
import { toast } from 'sonner';
import styles from './billing.module.css';

const PLANS = [
  {
    id: 'free',
    name: 'الباقة المجانية',
    price: '0',
    icon: Target,
    color: '#64748b',
    features: ['حتى 10 طلبات شهرياً', 'لوحة تحكم أساسية', 'دعم عبر واتساب', 'متجر احترافي'],
    limit: 'قفل عند 15 طلب'
  },
  {
    id: 'pro',
    name: 'الباقة الاحترافية',
    price: '15',
    icon: Zap,
    color: '#3b82f6',
    features: ['طلبات غير محدودة', 'تقارير وتحليلات متقدمة', 'نظام الكوبونات والخصم', 'أولوية في الدعم الفني'],
    limit: 'الأكثر شيوعاً 🔥',
    isPopular: true
  },
  {
    id: 'business',
    name: 'باقة الأعمال',
    price: '35',
    icon: Crown,
    color: '#8b5cf6',
    features: ['كل ميزات البرو', 'تقارير شاملة PDF', 'وكيل دعم مخصص', 'وصول مبكر للميزات'],
    limit: 'للمتاجر الكبيرة 🚀'
  }
];

export default function BillingPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug, merchantId } = useAuthStore();
  const { data: storeInfo } = useStreamingFetch(() => getStoreInfo(storeSlug || ''), [storeSlug], `store_${storeSlug}`);
  const { data: platformSettings } = useStreamingFetch(() => getPlatformSettings(), [], 'platform_settings');

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug || !merchantId || !selectedPlan) return;
    
    setIsUploading(true);
    try {
      // In a real scenario, we would upload the file to Firebase Storage first.
      // For this demo, we'll use a placeholder URL.
      await submitPaymentProof({
        storeSlug,
        merchantId,
        planType: selectedPlan.id,
        amount: parseFloat(selectedPlan.price),
        currency: 'USD',
        receiptUrl: 'https://placehold.co/600x400?text=Payment+Receipt', // Placeholder
        notes: `طلب ترقية إلى باقة ${selectedPlan.name}`
      });
      
      setUploadSuccess(true);
      setSelectedPlan(null);
      toast.success('تم إرسال إثبات الدفع بنجاح. سيتم التفعيل قريباً!');
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (error) {
      toast.error('فشل إرسال الإثبات. يرجى المحاولة لاحقاً.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>الاشتراكات والفوترة 💳</h1>
        <p className={styles.subtitle}>اختر الخطة المناسبة لنمو تجارتك</p>
      </header>

      {/* Current Plan Status */}
      <div className={styles.currentPlanGrid}>
        <div className={styles.statusCard}>
          <div className={styles.statusInfo}>
            <p>خطتك الحالية</p>
            <h3>{storeInfo?.planType === 'pro' ? 'الباقة الاحترافية' : storeInfo?.planType === 'business' ? 'باقة الأعمال' : 'الباقة المجانية'}</h3>
          </div>
          <div className={styles.planBadge} data-plan={storeInfo?.planType || 'free'}>
            {storeInfo?.subscriptionStatus === 'active' ? <ShieldCheck size={16} /> : <Clock size={16} />}
            {storeInfo?.subscriptionStatus === 'pending' ? 'قيد التحقق' : storeInfo?.subscriptionStatus === 'active' ? 'نشط' : 'غير نشط'}
          </div>
        </div>
        
        <div className={styles.usageCard}>
          <div className={styles.usageHeader}>
            <span>استهلاك الطلبات</span>
            <span>{storeInfo?.orderCountMonth || 0} / 10</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${Math.min(((storeInfo?.orderCountMonth || 0) / 10) * 100, 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className={styles.pricingGrid}>
        {PLANS.map((plan) => (
          <motion.div 
            key={plan.id}
            whileHover={{ y: -5 }}
            className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''}`}
          >
            {plan.isPopular && <div className={styles.popularLabel}>الموصى به</div>}
            <div className={styles.planHeader}>
              <div className={styles.iconBox} style={{ color: plan.color, backgroundColor: `${plan.color}15` }}>
                <plan.icon size={24} />
              </div>
              <h3>{plan.name}</h3>
              <div className={styles.price}>
                <span>$</span>
                {plan.price}
                <small>/شهرياً</small>
              </div>
            </div>

            <ul className={styles.featuresList}>
              {plan.features.map((f, i) => (
                <li key={i}><Check size={16} className={styles.checkIcon} /> {f}</li>
              ))}
            </ul>

            <p className={styles.planLimit}>{plan.limit}</p>

            {plan.id !== 'free' && (
              <button 
                onClick={() => setSelectedPlan(plan)}
                className={styles.upgradeBtn}
                style={{ backgroundColor: plan.color }}
              >
                تفعيل الباقة
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Manual Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={styles.modal}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>تفعيل {selectedPlan.name}</h2>
                <button onClick={() => setSelectedPlan(null)} className={styles.closeBtn}>&times;</button>
              </div>

              <div className={styles.paymentInfo}>
                <div className={styles.bankDetails}>
                  <Info size={20} />
                  <div>
                    <p>يرجى تحويل مبلغ <strong>${selectedPlan.price}</strong> إلى أحد الحسابات التالية:</p>
                    <div className={styles.accountsList}>
                      {platformSettings?.bankAccounts && platformSettings.bankAccounts.length > 0 ? (
                        platformSettings.bankAccounts.map((bank, i) => (
                          <div key={i} className={styles.accountItem}>
                            <strong>{bank.bankName}:</strong> {bank.accountNumber}
                            <span>({bank.accountName})</span>
                          </div>
                        ))
                      ) : (
                        <p>تواصل مع الإدارة للحصول على بيانات التحويل.</p>
                      )}
                    </div>
                  </div>
                </div>

                <form className={styles.uploadForm} onSubmit={handleManualPayment}>
                  <div className={styles.uploadArea}>
                    <Upload size={40} />
                    <p>انقر لرفع إيصال الدفع (صورة التحويل)</p>
                    <input type="file" accept="image/*" required />
                  </div>

                  <button 
                    disabled={isUploading} 
                    className={styles.submitBtn}
                    style={{ backgroundColor: selectedPlan.color }}
                  >
                    {isUploading ? 'جاري الرفع...' : 'إرسال للتأكيد'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      {uploadSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.successToast}
        >
          <Target /> تم رفع الإثبات بنجاح؛ سيتم تفعيل حسابك خلال ساعات!
        </motion.div>
      )}
    </div>
  );
}
