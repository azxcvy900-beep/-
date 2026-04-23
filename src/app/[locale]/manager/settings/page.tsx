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
  BellRing
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPlatformSettings, updatePlatformSettings, PlatformSettings } from '@/lib/api';
import { toast } from 'sonner';
import styles from './settings.module.css';

export default function ManagerSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Global settings state
  const [settings, setSettings] = useState<PlatformSettings>({
    platformFee: 2.5,
    maintenanceMode: false,
    defaultCurrency: 'USD',
    supportPhone: '967770000000',
    currencyRates: {
      YER: 530,
      SAR: 140
    },
    notifications: {
      newMerchant: true,
      highComplaint: true,
      systemAlert: true
    }
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
          <h1 className={styles.title}>الإعدادات العالمية</h1>
          <p className={styles.subtitle}>تكوين القواعد والبروتوكولات العامة للمنصة</p>
        </div>
        <button 
          className={styles.saveBtn} 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <RefreshCw className={styles.spin} /> : <Save size={20} />}
          حفظ التغييرات
        </button>
      </header>

      <div className={styles.tabsArea}>
        <button 
          className={`${styles.tab} ${activeTab === 'general' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Globe size={18} /> الإعدادات العامة
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'financial' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <DollarSign size={18} /> المالية والرسوم
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'system' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <Server size={18} /> النظام والحماية
        </button>
      </div>

      <div className={styles.settingsContent}>
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>تكوين النظام الأساسي</h3>
            <div className={styles.formGroup}>
              <label>رسوم المنصة (%)</label>
              <input 
                type="number" 
                value={settings.platformFee} 
                onChange={(e) => setSettings({...settings, platformFee: parseFloat(e.target.value)})}
              />
              <p className={styles.helper}>النسبة المستقطعة من كل عملية ناجحة تتم عبر المنصة.</p>
            </div>
            
            <div className={styles.formGroup}>
              <label>العملة الافتراضية</label>
              <select 
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
              >
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="YER">ريال يمني (YER)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
              </select>
            </div>
          </motion.div>
        )}

        {activeTab === 'financial' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>صرف العملات والرسوم</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>سعر الدولار (YER)</label>
                <input 
                  type="number" 
                  value={settings.currencyRates.YER}
                  onChange={(e) => setSettings({...settings, currencyRates: {...settings.currencyRates, YER: parseInt(e.target.value)}})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>سعر السعودي (YER)</label>
                <input 
                  type="number" 
                  value={settings.currencyRates.SAR}
                  onChange={(e) => setSettings({...settings, currencyRates: {...settings.currencyRates, SAR: parseInt(e.target.value)}})}
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.card}>
            <h3>حالة المنصة والأمان</h3>
            <div className={styles.toggleGroup}>
              <div className={styles.toggleInfo}>
                <p>وضع الصيانة (Maintenance Mode)</p>
                <span>عند التفعيل، لن يتمكن العملاء من تصفح المتاجر، وستظهر رسالة صيانة.</span>
              </div>
              <button 
                className={`${styles.toggle} ${settings.maintenanceMode ? styles.toggleOn : ''}`}
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
              >
                <div className={styles.toggleDot} />
              </button>
            </div>

            <div className={styles.alertCard}>
              <AlertTriangle size={24} color="#f59e0b" />
              <div>
                <h4>تحذير أمان</h4>
                <p>تفعيل وضع الصيانة سيؤثر على كافة التجار والشركاء بشكل مباشر وفوري.</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
