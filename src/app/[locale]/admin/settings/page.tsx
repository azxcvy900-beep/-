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
import { useAuthStore } from '@/lib/auth-store';
import styles from './settings.module.css';

export default function MerchantSettings() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
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
        const data = await getStoreInfo(storeSlug || 'demo');
        if (data) {
          setStoreData(data);
          setLogoPreview(data.logo || null);
        } else {
          // Initialize with empty data if nothing found
          setStoreData({
            slug: storeSlug || 'demo',
            name: '',
            phone: '',
            description: '',
            primaryColor: '#3b82f6', // Default blue
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
  }, [storeSlug]);

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
        finalLogoUrl = await uploadStoreLogo(selectedLogo, storeSlug || 'demo');
      }

      const updatedData = {
        ...storeData,
        logo: finalLogoUrl
      };

      // 2. Save all info
      await updateStoreInfo(storeSlug || 'demo', updatedData);
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
          <h3 className={styles.sectionTitle}>هوية المتجر البصرية</h3>
          <div className={styles.formGrid}>
             <div className={styles.inputGroup}>
               <label>اللون الأساسي للمتجر</label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <input 
                   type="color"
                   style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '0', background: 'none' }}
                   value={storeData?.primaryColor || '#3b82f6'}
                   onChange={(e) => setStoreData(prev => prev ? {...prev, primaryColor: e.target.value} : null)}
                 />
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{storeData?.primaryColor || '#3b82f6'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>يستخدم في الأزرار والعناصر الرئيسية.</span>
                 </div>
               </div>
             </div>

             <div className={styles.inputGroup}>
               <label>اللون الثانوي (باقة بزنس 💎)</label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: storeData?.planType === 'business' ? 1 : 0.6 }}>
                 <input 
                   type="color"
                   disabled={storeData?.planType !== 'business'}
                   style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: storeData?.planType === 'business' ? 'pointer' : 'not-allowed', padding: '0', background: 'none' }}
                   value={storeData?.secondaryColor || '#64748b'}
                   onChange={(e) => setStoreData(prev => prev ? {...prev, secondaryColor: e.target.value} : null)}
                 />
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{storeData?.secondaryColor || '#64748b'}</span>
                    {storeData?.planType !== 'business' ? (
                      <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>قم بالترقية لتفعيل هذا اللون</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>يستخدم في العناصر الفرعية والتذييل.</span>
                    )}
                 </div>
               </div>
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

        {/* قسم إعدادات العملة */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>إعدادات العملات وأسعار الصرف</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>العملة الافتراضية للمتجر</label>
              <select 
                className={styles.input}
                value={storeData?.currencySettings?.default || 'YER'}
                onChange={(e) => setStoreData(prev => prev ? {
                  ...prev,
                  currencySettings: {
                    ...prev.currencySettings,
                    default: e.target.value,
                    rates: prev.currencySettings?.rates || { 'SAR': 140, 'USD': 530 }
                  }
                } : null)}
              >
                <option value="YER">ريال يمني (YER)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>

            {storeData?.currencySettings?.default === 'YER' && (
              <div className={`${styles.inputGroup} ${styles.fullWidth}`} style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={storeData?.currencySettings?.useManualSARRate || false}
                    onChange={(e) => setStoreData(prev => prev ? {
                      ...prev,
                      currencySettings: {
                        ...(prev.currencySettings || { default: 'YER', rates: { 'SAR': 140, 'USD': 530 } }),
                        useManualSARRate: e.target.checked
                      }
                    } : null)}
                  />
                  <span>استخدام سعر صرف يدوي للريال السعودي (ثابت)</span>
                </label>
              </div>
            )}
            
            {(!storeData?.currencySettings?.useManualSARRate || storeData?.currencySettings?.default !== 'YER') ? (
              <>
                <div className={styles.inputGroup}>
                  <label>سعر صرف الريال السعودي (تلقائي)</label>
                  <input 
                    type="number"
                    className={styles.input}
                    value={storeData?.currencySettings?.rates?.['SAR'] || ''}
                    placeholder="مثال: 140"
                    onChange={(e) => setStoreData(prev => {
                      if (!prev) return null;
                      const newRates = { ...(prev.currencySettings?.rates || { 'USD': 530 }) };
                      newRates['SAR'] = parseFloat(e.target.value);
                      return {
                        ...prev,
                        currencySettings: {
                          ...(prev.currencySettings || { default: 'YER' }),
                          rates: newRates
                        }
                      };
                    })}
                  />
                </div>
              </>
            ) : (
              <div className={styles.inputGroup}>
                <label>سعر صرف الريال السعودي (يدوي)</label>
                <input 
                  type="number"
                  className={styles.input}
                  value={storeData?.currencySettings?.manualSARRate || ''}
                  placeholder="مثال: 400"
                  onChange={(e) => setStoreData(prev => prev ? {
                    ...prev,
                    currencySettings: {
                      ...(prev.currencySettings || { default: 'YER', rates: { 'SAR': 140, 'USD': 530 } }),
                      manualSARRate: parseFloat(e.target.value)
                    }
                  } : null)}
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label>سعر صرف الدولار (مقابل اليمني)</label>
              <input 
                type="number"
                className={styles.input}
                value={storeData?.currencySettings?.rates?.['USD'] || ''}
                placeholder="مثال: 535"
                onChange={(e) => setStoreData(prev => {
                  if (!prev) return null;
                  const newRates = { ...(prev.currencySettings?.rates || { 'SAR': 140 }) };
                  newRates['USD'] = parseFloat(e.target.value);
                  return {
                    ...prev,
                    currencySettings: {
                      ...(prev.currencySettings || { default: 'YER' }),
                      rates: newRates
                    }
                  };
                })}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
            ملاحظة: يتم استخدام هذه الأسعار لتحويل قيمة المنتجات تلقائياً عند تغيير العميل للعملة.
          </p>
        </div>

        {/* قسم اللوجستيات والشحن */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>اللوجستيات والشحن</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>رسوم التوصيل الثابتة (ر.ي)</label>
              <input 
                type="number"
                className={styles.input}
                value={storeData?.shippingFee || 0}
                placeholder="مثال: 2000"
                onChange={(e) => setStoreData(prev => prev ? {
                  ...prev,
                  shippingFee: parseFloat(e.target.value) || 0
                } : null)}
              />
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.4rem' }}>
                سيتم إضافة هذا المبلغ تلقائياً إلى إجمالي الطلب عند الدفع.
              </p>
            </div>
          </div>
        </div>

        {/* قسم الـ SEO */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>تحسين محركات البحث (SEO)</h3>
          <div className={styles.formGrid}>
            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>قالب عنوان المتجر (مثال: %s | متجري)</label>
              <input 
                className={styles.input}
                placeholder="%s | أسم المتجر"
                value={storeData?.seo?.titleTemplate || ''}
                onChange={(e) => setStoreData(prev => prev ? {
                  ...prev,
                  seo: { ...(prev.seo || {}), titleTemplate: e.target.value }
                } : null)}
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>وصف المتجر لمحركات البحث</label>
              <textarea 
                className={styles.textarea}
                placeholder="وصف مختصر وجذاب لمحركات البحث..."
                value={storeData?.seo?.description || ''}
                onChange={(e) => setStoreData(prev => prev ? {
                  ...prev,
                  seo: { ...(prev.seo || {}), description: e.target.value }
                } : null)}
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>الكلمات المفتاحية (SEO Keywords)</label>
              <input 
                className={styles.input}
                placeholder="جوالات, إلكترونيات, تسوق (افصل بينها بفاصلة)"
                value={storeData?.seo?.keywords?.join(', ') || ''}
                onChange={(e) => setStoreData(prev => prev ? {
                  ...prev,
                  seo: { 
                    ...(prev.seo || {}), 
                    keywords: e.target.value.split(',').map(k => k.trim()) 
                  }
                } : null)}
              />
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
