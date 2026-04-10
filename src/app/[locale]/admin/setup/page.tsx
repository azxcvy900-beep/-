'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Share2, 
  Palette, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Globe,
  MessageCircle,
  AtSign,
  DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { updateStoreInfo, updateMerchant } from '@/lib/api';
import { useSessionStore } from '@/lib/session-store';
import styles from './setup.module.css';

const steps = [
  { id: 'identity', title: 'هوية المتجر', icon: Store },
  { id: 'social', title: 'التواصل الاجتماعي', icon: Share2 },
  { id: 'branding', title: 'التخصيص والعملة', icon: Palette }
];

export default function MerchantSetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const { username, setStoreSlug } = useSessionStore();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    whatsapp: '',
    instagram: '',
    primaryColor: '#1a73e8',
    currency: 'YER'
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleFinish = async () => {
    if (!username) return;
    setLoading(true);
    
    try {
      const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
      
      // 1. Create/Update Store Record
      await updateStoreInfo(slug, {
        name: formData.name,
        description: formData.description,
        phone: formData.whatsapp,
        primaryColor: formData.primaryColor,
        merchantId: username, // Link store to merchant username
        subscriptionStatus: 'active', // Default for new signups
        planType: 'free',
        currencySettings: {
          default: formData.currency,
          rates: { YER: 530, SAR: 140 }
        },
        social: {
          instagram: formData.instagram,
          whatsapp: formData.whatsapp
        }
      });
      
      // 2. Link store to Merchant Profile
      await updateMerchant(username, { storeSlug: slug });
      
      // 3. Update Session State
      setStoreSlug(slug);

      // Success! Redirect to dashboard
      router.push(`/${locale}/admin/dashboard`);
    } catch (error) {
      console.error("Setup error:", error);
      alert("حدث خطأ أثناء إعداد المتجر. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.setupContainer}>
      <div className={styles.progressHeader}>
        <div className={styles.logo}>بايرز <span>تجهيز</span></div>
        <div className={styles.stepsIndicator}>
          {steps.map((step, i) => (
            <div key={step.id} className={`${styles.stepItem} ${i <= currentStep ? styles.activeStep : ''}`}>
              <div className={styles.stepIcon}><step.icon size={20} /></div>
              <span>{step.title}</span>
              {i < steps.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>
      </div>

      <main className={styles.wizardMain}>
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div 
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={styles.stepContent}
            >
              <h2>أهلاً بك في بايرز! لنبدأ بهوية متجرك</h2>
              <div className={styles.formGroup}>
                <label>اسم المتجر (مثال: متجر السعيد)</label>
                <div className={styles.inputWrapper}>
                  <Store size={18} />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="أدخل اسم المتجر"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>رابط المتجر (سيكون: buyers.ye/store/رابطك)</label>
                <div className={styles.inputWrapper}>
                  <Globe size={18} />
                  <input 
                    type="text" 
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    placeholder="my-awesome-store"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={styles.stepContent}
            >
              <h2>إعداد قنوات التواصل</h2>
              <div className={styles.formGroup}>
                <label>رقم الواتساب (لإرسال الطلبات مباشرة)</label>
                <div className={styles.inputWrapper}>
                  <MessageCircle size={18} />
                  <input 
                    type="tel" 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="967770000000"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>رابط انستقرام (اختياري)</label>
                <div className={styles.inputWrapper}>
                  <AtSign size={18} />
                  <input 
                    type="text" 
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    placeholder="youraccount"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={styles.stepContent}
            >
              <h2>لمساتك الأخيرة</h2>
              <div className={styles.formGroup}>
                <label>اللون الرئيسي للمتجر</label>
                <div className={styles.colorPicker}>
                   <input 
                     type="color" 
                     value={formData.primaryColor}
                     onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                   />
                   <span>اختر لوناً يعبر عن هويتك</span>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>العملة الافتراضية</label>
                <div className={styles.inputWrapper}>
                  <DollarSign size={18} />
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  >
                    <option value="YER">ريال يمني (YER)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className={styles.wizardFooter}>
        <button 
          className={styles.backBtn}
          onClick={prevStep}
          disabled={currentStep === 0 || loading}
        >
          <ArrowRight size={18} /> السابق
        </button>

        {currentStep < steps.length - 1 ? (
          <button 
            className={styles.nextBtn}
            onClick={nextStep}
            disabled={!formData.name || !formData.slug}
          >
            التالي <ArrowLeft size={18} />
          </button>
        ) : (
          <button 
            className={styles.finishBtn}
            onClick={handleFinish}
            disabled={loading}
          >
            {loading ? 'جاري التجهيز...' : 'إطلاق متجري الآن'} 
            {!loading && <CheckCircle2 size={18} style={{ marginRight: '8px' }} />}
          </button>
        )}
      </footer>
    </div>
  );
}
