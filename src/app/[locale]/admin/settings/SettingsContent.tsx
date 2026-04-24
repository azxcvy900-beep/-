'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Save, 
  Loader2, 
  CheckCircle, 
  Globe, 
  X, 
  Image as ImageIcon, 
  Maximize2,
  Store,
  ChevronLeft,
  Send,
  MessageCircle,
  Phone,
  Info,
  Tablet,
  Monitor,
  Smartphone,
  Tv,
  ShieldCheck,
  Plus,
  Trash2,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getStoreInfo, 
  updateStoreInfo, 
  uploadStoreLogo, 
  StoreInfo, 
  getPlatformSettings, 
  updatePlatformSettings, 
  PlatformSettings,
  HeroMedia,
  uploadPlatformMedia
} from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useSessionStore } from '@/lib/session-store';
import { compressImage, getSquareCroppedImg, fileToBase64 } from '@/lib/utils';
import styles from './settings.module.css';

export default function SettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug, setStoreInfo } = useAuthStore();
  const { role } = useSessionStore();
  
  const [storeData, setStoreData] = useState<StoreInfo | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    platformFee: 2.5,
    maintenanceMode: false,
    defaultCurrency: 'USD',
    supportPhone: '967770000000',
    currencyRates: { YER: 530, SAR: 140 },
    notifications: { newMerchant: true, highComplaint: true, systemAlert: true }
  });
  const [initialPlatformData, setInitialPlatformData] = useState<PlatformSettings | null>(null);
  const [initialData, setInitialData] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [saveStep, setSaveStep] = useState<'' | 'compressing' | 'uploading' | 'saving'>('');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [inlinePreviewDevice, setInlinePreviewDevice] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('mobile');

  useEffect(() => {
    async function loadStore() {
      try {
        const data = await getStoreInfo(storeSlug || 'demo');
        if (data) {
          setStoreData(data);
          setInitialData(data);
          setLogoPreview(data.logo || null);
        } else {
          const defaultData: StoreInfo = {
            slug: storeSlug || 'demo',
            name: '',
            phone: '',
            description: '',
            primaryColor: '#3b82f6',
            logo: '',
            social: { instagram: '', twitter: '', facebook: '' }
          };
          setStoreData(defaultData);
          setInitialData(defaultData);
        }

        if (role === 'admin') {
          try {
            const pData = await getPlatformSettings();
            setPlatformSettings(pData);
            setInitialPlatformData(pData);
          } catch {
            // Keep the default value already set
            setInitialPlatformData(platformSettings);
          }
        }
      } catch (error) {
        console.error("Error loading store settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [storeSlug, role]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogoUrl(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmCrop = async () => {
    if (!tempLogoUrl) return;
    setIsCropping(true);
    try {
      const croppedBlob = await getSquareCroppedImg(tempLogoUrl);
      const croppedFile = new File([croppedBlob], 'logo_cropped.jpg', { type: 'image/jpeg' });
      const finalizedFile = await compressImage(croppedFile, 400, 0.7);
      setSelectedLogo(finalizedFile);
      setLogoPreview(URL.createObjectURL(finalizedFile));
      setShowCropModal(false);
    } catch (error) {
      console.error("Crop error:", error);
      alert("حدث خطأ أثناء معالجة الصورة");
    } finally {
      setIsCropping(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeData) return;
    setSaving(true);
    setSuccess(false);
    setSaveStep('compressing');
    try {
      // 1. Save Platform Settings if Admin
      if (role === 'admin' && platformSettings) {
        await updatePlatformSettings(platformSettings);
        setInitialPlatformData(platformSettings);
      }

      // 2. Save Store Settings
      let finalLogoUrl = storeData.logo;
      if (selectedLogo) {
        setSaveStep('saving');
        const compressed = await compressImage(selectedLogo, 400, 0.7);
        finalLogoUrl = await fileToBase64(compressed);
      } else {
        setSaveStep('saving');
      }
      const updatedData = {
        ...storeData,
        logo: finalLogoUrl || storeData.logo || ''
      };
      await updateStoreInfo(storeSlug || 'demo', updatedData);
      setStoreData(updatedData);
      setInitialData(updatedData);
      setStoreInfo(updatedData); // Update global header logo
      setLogoPreview(updatedData.logo || null); // Update local preview
      setSelectedLogo(null);
      setSaveStep('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setSaveStep('');
      console.error("Save error:", error);
      alert("⚠️ عذراً، فشل الحفظ! السبب الفني: " + (error.message || "خطأ غير معروف في الاتصال"));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (storeData && initialData && (
    JSON.stringify(storeData) !== JSON.stringify(initialData) || 
    selectedLogo !== null
  )) || (role === 'admin' && platformSettings && initialPlatformData && (
    JSON.stringify(platformSettings) !== JSON.stringify(initialPlatformData)
  ));

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '10rem' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" /></div>;
  }

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('sidebar.settings')}</h1>
          <p className={styles.subtitle}>تحكم في هوية متجرك ومعلومات التواصل.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CheckCircle size={20} /> تم الحفظ
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="button"
            onClick={() => setShowLivePreview(true)}
            className={styles.previewLiveBtn}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Globe size={20} /> معاينة المتجر المباشرة
          </button>

          <button 
            type="button" 
            onClick={(e) => handleSave(e as any)} 
            className={`${styles.saveBtn} ${hasChanges ? styles.saveBtnUnsaved : ''}`} 
            style={hasChanges ? { backgroundColor: storeData?.primaryColor || '#10b981', boxShadow: `0 0 0 0 ${storeData?.primaryColor}70` } : {}}
            disabled={saving || (!hasChanges && !saving)}
          >
            {saving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : hasChanges ? (
              <>
                <Save size={20} /> حفظ التغييرات
              </>
            ) : (
              <>
                <CheckCircle size={20} /> تم الحفظ
              </>
            )}
          </button>
        </div>
      </div>

      <Suspense fallback={<div style={{ textAlign: 'center', padding: '10rem' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" /></div>}>
        <form onSubmit={handleSave} className={styles.card}>
          <div className={styles.section} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>مُعاينة الهوية البصرية (Live)</h3>
              <button 
                type="button" 
                onClick={() => setShowLivePreview(true)}
                className={styles.fullScreenBtn}
              >
                <Maximize2 size={16} /> ملء الشاشة
              </button>
            </div>
            
            <div className={styles.themePreview}>
              <div className={styles.inlineDeviceSwitcher}>
                <button 
                  type="button" 
                  onClick={() => setInlinePreviewDevice('mobile')}
                  className={inlinePreviewDevice === 'mobile' ? styles.activeInlineDevice : ''}
                  title="جوال"
                ><Smartphone size={18} /></button>
                <button 
                  type="button" 
                  onClick={() => setInlinePreviewDevice('tablet')}
                  className={inlinePreviewDevice === 'tablet' ? styles.activeInlineDevice : ''}
                  title="أيباد"
                ><Tablet size={18} /></button>
                <button 
                  type="button" 
                  onClick={() => setInlinePreviewDevice('desktop')}
                  className={inlinePreviewDevice === 'desktop' ? styles.activeInlineDevice : ''}
                  title="كمبيوتر"
                ><Monitor size={18} /></button>
                <button 
                  type="button" 
                  onClick={() => setInlinePreviewDevice('wide')}
                  className={inlinePreviewDevice === 'wide' ? styles.activeInlineDevice : ''}
                  title="شاشة كبيرة"
                ><Tv size={18} /></button>
              </div>

              <div className={styles.previewContainerWrapper}>
                <div className={`${styles.previewIframeContainer} ${styles[inlinePreviewDevice + 'Frame']}`}>
                  {inlinePreviewDevice === 'mobile' && <div className={styles.phoneNotch} />}
                  <div className={styles.iframeScaleWrapper}>
                    <iframe 
                      key={`${storeData?.primaryColor}-${logoPreview}-${inlinePreviewDevice}`}
                      src={`/${locale}/store/${storeSlug || 'demo'}?preview=true&primaryColor=${encodeURIComponent(storeData?.primaryColor || '')}&logo=${encodeURIComponent(logoPreview || '')}`} 
                      title="Store Live Preview"
                    />
                  </div>
                  {inlinePreviewDevice === 'desktop' && <div className={styles.monitorStand} />}
                </div>
              </div>
              <p className={styles.previewHint}>تتحاكي هذه الشاشة طريقة عرض متجرك على الأجهزة المختلفة بشكل واقعي.</p>
            </div>
          </div>

          <div className={styles.section} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '2rem' }}>
            <h3 className={styles.sectionTitle}>شعار المتجر</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                {logoPreview ? (
                  <img key={logoPreview} src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo Preview" />
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
                  style={{ padding: '0.6rem 1.2rem', backgroundColor: storeData?.primaryColor || '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'inline-block', fontSize: '0.9rem' }}
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
          {role === 'admin' && (
            <div className={styles.section} style={{ borderTop: '2px solid var(--primary)', marginTop: '3rem', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <ShieldCheck size={24} color="var(--primary)" />
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>إعدادات الإدارة العامة (المنصة)</h3>
              </div>
              <div className={styles.formGrid}>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>رقم هاتف الإدارة العامة للشكاوي (واتساب الدعم)</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
                      <Phone size={18} />
                    </div>
                    <input 
                      className={styles.input}
                      style={{ paddingRight: '3rem' }}
                      placeholder="967770000000"
                      value={platformSettings.supportPhone || ''}
                      onChange={(e) => setPlatformSettings(prev => ({...prev, supportPhone: e.target.value}))}
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    هذا الرقم هو الذي سيظهر للعملاء والموظفين عند الضغط على زر "تواصل معنا" العائم في المتجر واللوحة.
                  </p>
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`} style={{ marginTop: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <ImageIcon size={18} />
                    وسائط الواجهة الرئيسية (صور وفيديوهات)
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {platformSettings.heroMedia?.map((media, index) => (
                      <div key={index} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
                        <button 
                          type="button"
                          onClick={() => {
                            const newMedia = [...(platformSettings.heroMedia || [])];
                            newMedia.splice(index, 1);
                            setPlatformSettings(prev => ({...prev, heroMedia: newMedia}));
                          }}
                          style={{ position: 'absolute', top: '-0.5rem', left: '-0.5rem', background: '#ef4444', color: 'white', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 10 }}
                        >
                          <Trash2 size={14} />
                        </button>
                        
                        <div style={{ marginBottom: '0.75rem' }}>
                          <select 
                            className={styles.input}
                            value={media.type}
                            onChange={(e) => {
                              const newMedia = [...(platformSettings.heroMedia || [])];
                              newMedia[index] = { ...media, type: e.target.value as 'image' | 'video' };
                              setPlatformSettings(prev => ({...prev, heroMedia: newMedia}));
                            }}
                          >
                            <option value="image">صورة</option>
                            <option value="video">فيديو (رابط مباشر)</option>
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            className={styles.input}
                            placeholder={media.type === 'image' ? "رابط الصورة..." : "رابط الفيديو..."}
                            value={media.url}
                            onChange={(e) => {
                              const newMedia = [...(platformSettings.heroMedia || [])];
                              newMedia[index] = { ...media, url: e.target.value };
                              setPlatformSettings(prev => ({...prev, heroMedia: newMedia}));
                            }}
                          />
                          {media.type === 'image' && (
                            <label className={styles.iconButton} style={{ cursor: 'pointer' }}>
                              <Plus size={18} />
                              <input 
                                type="file" 
                                hidden 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const url = await uploadPlatformMedia(file);
                                      const newMedia = [...(platformSettings.heroMedia || [])];
                                      newMedia[index] = { ...media, url };
                                      setPlatformSettings(prev => ({...prev, heroMedia: newMedia}));
                                    } catch (err) {
                                      console.error("Upload failed", err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {media.url && (
                          <div style={{ marginTop: '1rem', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            {media.type === 'image' ? (
                              <img src={media.url} alt="Hero Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white' }}>
                                <Video size={24} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setPlatformSettings(prev => ({
                          ...prev, 
                          heroMedia: [...(prev.heroMedia || []), { type: 'image', url: '' }]
                        }));
                      }}
                      className={styles.addBtn}
                      style={{ height: '100%', minHeight: '150px', border: '2px dashed #e5e7eb', background: 'transparent', color: '#6b7280' }}
                    >
                      <Plus size={24} />
                      إضافة وسيط جديد
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '1rem' }}>
                    يمكنك إضافة عدة صور أو روابط فيديو لعرضها في واجهة المنصة الرئيسية. سيتم عرضها بترتيبها الحالي.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save button removed from bottom as requested */}
        </form>
      </Suspense>

      <AnimatePresence>
        {showCropModal && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={styles.cropModal}
            >
              <div className={styles.modalHeader}>
                <h3>محرر الشعار الذكي</h3>
                <button type="button" onClick={() => setShowCropModal(false)} className={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <p>سيتم قص الصورة لتصبح مربعة وتلقائية التوسيط. تأكد من أن الجزء الأهم في المنتصف.</p>
                <div className={styles.cropPreviewContainer}>
                  <div className={styles.cropCircle}>
                    <img src={tempLogoUrl || ''} alt="Preview" />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button"
                  onClick={() => setShowCropModal(false)} 
                  className={styles.cancelButton}
                  disabled={isCropping}
                >
                  إلغاء
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmCrop} 
                  className={styles.confirmButton}
                  disabled={isCropping}
                >
                  {isCropping ? 'جاري المعالجة...' : 'قص واعتماد الشعار'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLivePreview && (
          <div className={styles.previewModalOverlay}>
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className={styles.livePreviewModal}
             >
                <div className={styles.previewModalHeader}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <h3>معاينة المتجر (مباشر)</h3>
                      <div className={styles.deviceSwitcher}>
                         <button 
                           onClick={() => setPreviewDevice('mobile')}
                           className={previewDevice === 'mobile' ? styles.activeDevice : ''}
                         >جوال</button>
                         <button 
                           onClick={() => setPreviewDevice('desktop')}
                           className={previewDevice === 'desktop' ? styles.activeDevice : ''}
                         >كمبيوتر</button>
                      </div>
                   </div>
                   <button onClick={() => setShowLivePreview(false)} className={styles.closePreviewBtn}>
                      <X size={24} />
                   </button>
                </div>
                <div className={styles.previewModalBody}>
                   <div className={`${styles.iframeContainer} ${previewDevice === 'mobile' ? styles.mobileView : styles.desktopView}`}>
                      <iframe 
                        src={`/${locale}/store/${storeSlug || 'demo'}?preview=true`} 
                        title="Store Preview"
                      />
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
