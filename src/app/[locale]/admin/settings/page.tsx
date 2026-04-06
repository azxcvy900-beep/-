'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Store, 
  Phone, 
  Info, 
  Globe, 
  Send, 
  MessageCircle, 
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoreInfo, updateStoreInfo, StoreInfo } from '@/lib/api';
import styles from './settings.module.css';

export default function MerchantSettings() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  
  const [storeData, setStoreData] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        const data = await getStoreInfo('demo');
        if (data) {
          setStoreData(data);
        } else {
          // Initialize with empty data if nothing found
          setStoreData({
            slug: 'demo',
            name: '',
            phone: '',
            description: '',
            social: { instagram: '', twitter: '', facebook: '' }
          });
        }
      } catch (error) {
        console.error("Error loading store settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeData) return;

    setSaving(true);
    setSuccess(false);

    try {
      // Ensure we are saving to the correct slug
      await updateStoreInfo('demo', storeData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Save error:", error);
      alert("حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>جاري تحميل الإعدادات...</div>;
  }

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('sidebar.settings')}</h1>
        <p className={styles.subtitle}>تحكم في هوية متجرك ومعلومات التواصل.</p>
      </div>

      <form onSubmit={handleSave} className={styles.card}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>المعلومات الأساسية</h3>
          <div className={styles.formGrid}>
            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>اسم المتجر</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={styles.input}
                  value={storeData?.name || ''}
                  onChange={(e) => setStoreData(prev => prev ? {...prev, name: e.target.value} : null)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>رقم هاتف التواصل</label>
              <input 
                className={styles.input}
                value={storeData?.phone || ''}
                onChange={(e) => setStoreData(prev => prev ? {...prev, phone: e.target.value} : null)}
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>وصف المتجر (يظهر في التذييل)</label>
              <textarea 
                className={styles.textarea}
                value={storeData?.description || ''}
                onChange={(e) => setStoreData(prev => prev ? {...prev, description: e.target.value} : null)}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>روابط التواصل الاجتماعي</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Instagram</label>
              <div className={styles.socialGroup}>
                <div className={styles.socialIcon}><Globe size={20} /></div>
                <input 
                  className={styles.input}
                  placeholder="اسم المستخدم"
                  value={storeData?.social?.instagram || ''}
                  onChange={(e) => setStoreData(prev => prev ? {
                    ...prev, 
                    social: { ...prev.social, instagram: e.target.value }
                  } : null)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Twitter / X</label>
              <div className={styles.socialGroup}>
                <div className={styles.socialIcon}><Send size={20} /></div>
                <input 
                  className={styles.input}
                  placeholder="اسم المستخدم"
                  value={storeData?.social?.twitter || ''}
                  onChange={(e) => setStoreData(prev => prev ? {
                    ...prev, 
                    social: { ...prev.social, twitter: e.target.value }
                  } : null)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Facebook</label>
              <div className={styles.socialGroup}>
                <div className={styles.socialIcon}><MessageCircle size={20} /></div>
                <input 
                  className={styles.input}
                  placeholder="رابط الصفحة"
                  value={storeData?.social?.facebook || ''}
                  onChange={(e) => setStoreData(prev => prev ? {
                    ...prev, 
                    social: { ...prev.social, facebook: e.target.value }
                  } : null)}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'جاري الحفظ...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={20} /> حفظ الإعدادات
              </span>
            )}
          </button>

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CheckCircle size={20} /> تم الحفظ بنجاح!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}
