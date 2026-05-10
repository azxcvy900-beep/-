'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  ShieldCheck, 
  ShieldOff,
  Phone,
  Calendar,
  ExternalLink,
  Plus,
  Ban,
  Snowflake,
  Activity,
  Package,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllStores, StoreInfo, updateStoreStatus, updateStorePlan } from '@/lib/api';
import { toast } from 'sonner';
import styles from './merchants.module.css';

export default function MerchantManagement() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await getAllStores();
      setStores(data);
    } catch (error) {
      console.error("Error loading stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (slug: string, newStatus: 'active' | 'banned' | 'frozen') => {
    if (!confirm(`هل أنت متأكد من تغيير حالة المتجر إلى ${newStatus === 'banned' ? 'محظور' : newStatus === 'frozen' ? 'مجمد' : 'نشط'}؟`)) return;
    
    setUpdatingId(slug);
    try {
      await updateStoreStatus(slug, newStatus);
      toast.success('تم تحديث حالة المتجر بنجاح');
      loadStores();
    } catch (error) {
      toast.error('فشل تحديث الحالة');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePlanChange = async (slug: string, newPlan: 'free' | 'pro' | 'business') => {
    setUpdatingId(slug);
    try {
      await updateStorePlan(slug, newPlan);
      toast.success('تم ترقية/تعديل الباقة بنجاح');
      loadStores();
    } catch (error) {
      toast.error('فشل تعديل الباقة');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && stores.length === 0) return <div className={styles.loading}>جاري جلب بيانات التجار...</div>;

  return (
    <div className={styles.merchantsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1>إدارة التجار والمتاجر</h1>
          <p>تحكم في المتاجر المسجلة، راقب حالاتهم، وقم بضبط الصلاحيات.</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم المتجر أو الرابط..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>المتجر</th>
              <th>الخطة</th>
              <th>رقم التواصل</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStores.map((store) => (
              <tr key={store.slug} className={updatingId === store.slug ? styles.rowUpdating : ''}>
                <td>
                  <div className={styles.storeCol}>
                    <img src={store.logo || '/favicon.ico'} alt={store.name} />
                    <div className={styles.storeMainInfo}>
                      <span className={styles.storeName}>{store.name}</span>
                      <code className={styles.slugCode}>/{store.slug}</code>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.planSelect} ${styles.business}`}>
                    وصول كامل (بزنس) 👑
                  </span>
                </td>
                <td>
                  <div className={styles.phoneCol}>
                    <Phone size={14} />
                    {store.phone}
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[store.status || 'active']}`}>
                    {store.status === 'banned' ? 'محظور' : store.status === 'frozen' ? 'مجمد' : 'نشط'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <a href={`/ar/store/${store.slug}`} target="_blank" rel="noopener noreferrer" title="معاينة المتجر" className={styles.actionIcon}>
                      <ExternalLink size={18} />
                    </a>
                    
                    {store.status !== 'active' ? (
                      <button 
                        title="تفعيل" 
                        className={`${styles.actionIcon} ${styles.activate}`}
                        onClick={() => handleStatusChange(store.slug, 'active')}
                        disabled={updatingId === store.slug}
                      >
                        <ShieldCheck size={18} />
                      </button>
                    ) : (
                      <>
                        <button 
                          title="تجميد" 
                          className={`${styles.actionIcon} ${styles.freeze}`}
                          onClick={() => handleStatusChange(store.slug, 'frozen')}
                          disabled={updatingId === store.slug}
                        >
                          <Snowflake size={18} />
                        </button>
                        <button 
                          title="حظر" 
                          className={`${styles.actionIcon} ${styles.ban}`}
                          onClick={() => handleStatusChange(store.slug, 'banned')}
                          disabled={updatingId === store.slug}
                        >
                          <Ban size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
