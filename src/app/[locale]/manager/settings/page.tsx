'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Globe, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle,
  Server,
  BellRing,
  Phone,
  Mail,
  Search,
  MessageCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPlatformSettings, updatePlatformSettings, PlatformSettings } from '@/lib/api';
import { toast } from 'sonner';
import styles from './settings.module.css';

export default function ManagerSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState<PlatformSettings>({
    platformFee: 2.5,
    maintenanceMode: false,
    defaultCurrency: 'USD',
    supportPhone: '967770000000',
    contactEmail: 'support@buyers.com',
    whatsappNumber: '967770000000',
    currencyRates: { YER: 530, SAR: 140 },
    notifications: { newMerchant: true, highComplaint: true, systemAlert: true },
    seo: { title: '', description: '', keywords: '' },
    socialMedia: { facebook: '', twitter: '', instagram: '' },
    features: { autoApproveStores: false, allowGuestCheckout: true },
    limits: { freePlanProducts: 50, proPlanProducts: 500 }
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getPlatformSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setFetching(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePlatformSettings(settings);
      toast.success('تم حفظ الإعدادات العالمية بنجاح!');
    } catch (error) {
      console.error("Save error:", error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className={styles.loading}>جاري تحميل إعدادات النظام...</div>;

  return (
    <div className={styles.settingsPage}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>الإعدادات العالمية للمنصة</h1>
          <p className={styles.subtitle}>تكوين القواعد والبروتوكولات العامة للمنصة بأكملها.</p>
        </div>
        <button 
          className={styles.saveBtn} 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <RefreshCw className={styles.spin} /> : <Save size={20} />}
          حفظ كافة التغييرات
        </button>
      </header>

      <div className={styles.tabsArea}>
        <button className={`${styles.tab} ${activeTab === 'general' ? styles.activeTab : ''}`} onClick={() => setActiveTab('general')}>
          <Globe size={18} /> الإعدادات العامة
        </button>
        <button className={`${styles.tab} ${activeTab === 'financial' ? styles.activeTab : ''}`} onClick={() => setActiveTab('financial')}>
          <DollarSign size={18} /> المالية والرسوم
        </button>
        <button className={`${styles.tab} ${activeTab === 'contact' ? styles.activeTab : ''}`} onClick={() => setActiveTab('contact')}>
          <Phone size={18} /> التواصل والشبكات
        </button>
        <button className={`${styles.tab} ${activeTab === 'seo' ? styles.activeTab : ''}`} onClick={() => setActiveTab('seo')}>
          <Search size={18} /> هوية المنصة (SEO)
        </button>
        <button className={`${styles.tab} ${activeTab === 'policies' ? styles.activeTab : ''}`} onClick={() => setActiveTab('policies')}>
          <FileText size={18} /> السياسات والحدود
        </button>
        <button className={`${styles.tab} ${activeTab === 'system' ? styles.activeTab : ''}`} onClick={() => setActiveTab('system')}>
          <Server size={18} /> النظام والإشعارات
        </button>
      </div>

      <div className={styles.settingsContent}>
        
        {/* --- GENERAL TAB --- */}
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>تكوين النظام الأساسي</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>رسوم المنصة (%)</label>
                <input type="number" value={settings.platformFee} onChange={(e) => setSettings({...settings, platformFee: parseFloat(e.target.value)})} />
                <p className={styles.helper}>النسبة المستقطعة من المبيعات التي تتم عبر المنصة.</p>
              </div>
              <div className={styles.formGroup}>
                <label>العملة الافتراضية</label>
                <select value={settings.defaultCurrency} onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="YER">ريال يمني (YER)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
               <label>عمولة خاصة إضافية (Commission Rate)</label>
               <input type="number" value={settings.commissionRate || ''} placeholder="0" onChange={(e) => setSettings({...settings, commissionRate: parseFloat(e.target.value)})} />
            </div>
          </motion.div>
        )}

        {/* --- FINANCIAL TAB --- */}
        {activeTab === 'financial' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>صرف العملات والرسوم</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>سعر صرف الدولار مقابل الريال اليمني</label>
                <input type="number" value={settings.currencyRates.YER} onChange={(e) => setSettings({...settings, currencyRates: {...settings.currencyRates, YER: parseInt(e.target.value)}})} />
              </div>
              <div className={styles.formGroup}>
                <label>سعر صرف الريال السعودي مقابل الريال اليمني</label>
                <input type="number" value={settings.currencyRates.SAR} onChange={(e) => setSettings({...settings, currencyRates: {...settings.currencyRates, SAR: parseInt(e.target.value)}})} />
              </div>
            </div>
          </motion.div>
        )}

        {/* --- CONTACT & SOCIAL TAB --- */}
        {activeTab === 'contact' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>معلومات الدعم الفني للمنصة</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>رقم هاتف الدعم / الشكاوى (يظهر للتجار والعملاء)</label>
                <input type="text" placeholder="مثال: 967770000000" value={settings.supportPhone} onChange={(e) => setSettings({...settings, supportPhone: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>رقم الواتساب الرسمي للمنصة</label>
                <input type="text" placeholder="مثال: 967770000000" value={settings.whatsappNumber || ''} onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>البريد الإلكتروني للتواصل</label>
                <input type="email" placeholder="support@domain.com" value={settings.contactEmail || ''} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} />
              </div>
            </div>
            
            <h3 style={{ marginTop: '2rem' }}>روابط السوشيال ميديا</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Instagram</label>
                <input type="text" value={settings.socialMedia?.instagram || ''} onChange={(e) => setSettings({...settings, socialMedia: {...(settings.socialMedia || { facebook:'', twitter:'', instagram:'' }), instagram: e.target.value}})} />
              </div>
              <div className={styles.formGroup}>
                <label>Twitter / X</label>
                <input type="text" value={settings.socialMedia?.twitter || ''} onChange={(e) => setSettings({...settings, socialMedia: {...(settings.socialMedia || { facebook:'', twitter:'', instagram:'' }), twitter: e.target.value}})} />
              </div>
              <div className={styles.formGroup}>
                <label>Facebook</label>
                <input type="text" value={settings.socialMedia?.facebook || ''} onChange={(e) => setSettings({...settings, socialMedia: {...(settings.socialMedia || { facebook:'', twitter:'', instagram:'' }), facebook: e.target.value}})} />
              </div>
            </div>
          </motion.div>
        )}

        {/* --- SEO & IDENTITY TAB --- */}
        {activeTab === 'seo' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>تحسين محركات البحث للصفحة الرئيسية</h3>
            <div className={styles.formGroup}>
              <label>عنوان المنصة (SEO Title)</label>
              <input type="text" placeholder="بايرز - المنصة الأفضل..." value={settings.seo?.title || ''} onChange={(e) => setSettings({...settings, seo: {...(settings.seo || { title:'', description:'', keywords:'' }), title: e.target.value}})} />
            </div>
            <div className={styles.formGroup}>
              <label>الوصف التعريفي (Meta Description)</label>
              <textarea style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }} rows={3} value={settings.seo?.description || ''} onChange={(e) => setSettings({...settings, seo: {...(settings.seo || { title:'', description:'', keywords:'' }), description: e.target.value}})} />
            </div>
            <div className={styles.formGroup}>
              <label>الكلمات المفتاحية (Keywords)</label>
              <input type="text" placeholder="افصل بينها بفاصلة" value={settings.seo?.keywords || ''} onChange={(e) => setSettings({...settings, seo: {...(settings.seo || { title:'', description:'', keywords:'' }), keywords: e.target.value}})} />
            </div>
          </motion.div>
        )}

        {/* --- POLICIES & LIMITS TAB --- */}
        {activeTab === 'policies' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>سياسات المنصة</h3>
            <div className={styles.toggleGroup}>
              <div className={styles.toggleInfo}>
                <p>الموافقة التلقائية على المتاجر الجديدة</p>
                <span>إذا تم الإيقاف، سيحتاج كل متجر إلى مراجعة وتفعيل من الإدارة أولاً.</span>
              </div>
              <button className={`${styles.toggle} ${settings.features?.autoApproveStores ? styles.toggleOn : ''}`} onClick={() => setSettings({...settings, features: {...(settings.features || { allowGuestCheckout:true, autoApproveStores:false }), autoApproveStores: !settings.features?.autoApproveStores}})}>
                <div className={styles.toggleDot} />
              </button>
            </div>
            <div className={styles.toggleGroup}>
              <div className={styles.toggleInfo}>
                <p>السماح بالشراء للزوار (Guest Checkout)</p>
                <span>السماح للعملاء بالشراء دون الحاجة لإنشاء حساب.</span>
              </div>
              <button className={`${styles.toggle} ${settings.features?.allowGuestCheckout ? styles.toggleOn : ''}`} onClick={() => setSettings({...settings, features: {...(settings.features || { autoApproveStores:false, allowGuestCheckout:true }), allowGuestCheckout: !settings.features?.allowGuestCheckout}})}>
                <div className={styles.toggleDot} />
              </button>
            </div>

            <h3 style={{ marginTop: '2rem' }}>حدود الباقات</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>الحد الأقصى لمنتجات الباقة المجانية</label>
                <input type="number" value={settings.limits?.freePlanProducts || 0} onChange={(e) => setSettings({...settings, limits: {...(settings.limits || { freePlanProducts:50, proPlanProducts:500 }), freePlanProducts: parseInt(e.target.value)}})} />
              </div>
              <div className={styles.formGroup}>
                <label>الحد الأقصى لمنتجات باقة البرو</label>
                <input type="number" value={settings.limits?.proPlanProducts || 0} onChange={(e) => setSettings({...settings, limits: {...(settings.limits || { freePlanProducts:50, proPlanProducts:500 }), proPlanProducts: parseInt(e.target.value)}})} />
              </div>
            </div>
          </motion.div>
        )}

        {/* --- SYSTEM & NOTIFICATIONS TAB --- */}
        {activeTab === 'system' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>إشعارات النظام للإدارة</h3>
            <div className={styles.toggleGroup}>
              <div className={styles.toggleInfo}>
                <p>إشعار عند تسجيل تاجر جديد</p>
                <span>تلقي إيميل أو تنبيه عند فتح متجر جديد.</span>
              </div>
              <button className={`${styles.toggle} ${settings.notifications?.newMerchant ? styles.toggleOn : ''}`} onClick={() => setSettings({...settings, notifications: {...settings.notifications, newMerchant: !settings.notifications?.newMerchant}})}>
                <div className={styles.toggleDot} />
              </button>
            </div>
            <div className={styles.toggleGroup}>
              <div className={styles.toggleInfo}>
                <p>تنبيه الشكاوى العالية</p>
                <span>إشعار في حال تكرر الشكاوى على متجر معين.</span>
              </div>
              <button className={`${styles.toggle} ${settings.notifications?.highComplaint ? styles.toggleOn : ''}`} onClick={() => setSettings({...settings, notifications: {...settings.notifications, highComplaint: !settings.notifications?.highComplaint}})}>
                <div className={styles.toggleDot} />
              </button>
            </div>

            <h3 style={{ marginTop: '2rem' }}>حالة المنصة والأمان</h3>
            <div className={styles.toggleGroup} style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
              <div className={styles.toggleInfo}>
                <p style={{ color: '#92400e' }}>وضع الصيانة (Maintenance Mode)</p>
                <span style={{ color: '#b45309' }}>عند التفعيل، لن يتمكن العملاء من تصفح المتاجر، وستظهر رسالة صيانة. تحذير: سيؤثر على جميع المستخدمين.</span>
              </div>
              <button className={`${styles.toggle} ${settings.maintenanceMode ? styles.toggleOn : ''}`} onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}>
                <div className={styles.toggleDot} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
