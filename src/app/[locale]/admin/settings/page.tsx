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
  AlertCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoreInfo, updateStoreInfo, uploadStoreLogo, StoreInfo } from '@/lib/api';
import styles from './settings.module.css';

export default function MerchantSettings() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  
  const [storeData, setStoreData] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Logo States
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        const data = await getStoreInfo('demo');
        if (data) {
          setStoreData(data);
          setLogoPreview(data.logo || null);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeData) return;

    setSaving(true);
    setSuccess(false);

    try {
      let finalLogoUrl = storeData.logo;

      // 1. Upload new logo if selected
      if (selectedLogo) {
        finalLogoUrl = await uploadStoreLogo(selectedLogo, 'demo');
      }

      const updatedData = {
        ...storeData,
        logo: finalLogoUrl
      };

      // 2. Save all info
      await updateStoreInfo('demo', updatedData);
      setStoreData(updatedData);
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
        {/* قسم الشعار */}
        <div className={styles.section} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '2rem' }}>
          <h3 className={styles.sectionTitle}>شعار المتجر</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              {logoPreview ? (
                <img src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo Preview" />
              ) : (
                <ImageIcon size={40} style={{ color: '#9ca3af' }} />
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input 
                type="file" 
                id="logo-upload" 
                accept="image/*" 
                onChange={handleLogoChange}
                style={{ display: 'none' }} 
              />
              <label 
                htmlFor="logo-upload" 
                style={{ padding: '0.6rem 1.2rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'inline-block', fontSize: '0.9rem' }}
              >
                تغيير الشعار
              </label>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>يفضل استخدام صورة مربعة بحجم 512x512 بكسل.</p>
            </div>
          </div>
        </div>

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
