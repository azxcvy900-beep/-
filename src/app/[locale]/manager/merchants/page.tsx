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
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllStores, StoreInfo } from '@/lib/api';
import styles from './merchants.module.css';

export default function MerchantManagement() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStores() {
      try {
        const data = await getAllStores();
        setStores(data);
      } catch (error) {
        console.error("Error loading stores:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, []);

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className={styles.loading}>جاري جلب بيانات التجار...</div>;

  return (
    <div className={styles.merchantsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1>إدارة التجار والمتاجر</h1>
          <p>تحكم في المتاجر المسجلة، راقب حالاتهم، وقم بضبط الصلاحيات.</p>
        </div>
        <button className={styles.addBtn}>
          <Plus size={18} /> إضافة تاجر يدوي
        </button>
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
        <div className={styles.filterGroup}>
          <button className={styles.filterBtn}><Filter size={18} /> تصفية</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>المتجر</th>
              <th>رابط المتجر (Slug)</th>
              <th>رقم التواصل</th>
              <th>الحالة</th>
              <th>تاريخ الاشتراك</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStores.map((store) => (
              <tr key={store.slug}>
                <td>
                  <div className={styles.storeCol}>
                    <img src={store.logo || '/favicon.ico'} alt={store.name} />
                    <span>{store.name}</span>
                  </div>
                </td>
                <td><code className={styles.slugCode}>/{store.slug}</code></td>
                <td>
                  <div className={styles.phoneCol}>
                    <Phone size={14} />
                    {store.phone}
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles.active}`}>
                    نشط <ShieldCheck size={12} />
                  </span>
                </td>
                <td>
                  <div className={styles.dateCol}>
                    <Calendar size={14} />
                    <span>01/01/2024</span>
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <a href={`/ar/store/${store.slug}`} target="_blank" rel="noopener noreferrer" title="معاينة المتجر" className={styles.actionIcon}>
                      <ExternalLink size={18} />
                    </a>
                    <button title="إدارة البيانات" className={styles.actionIcon} onClick={() => alert('سيتم فتح بيانات المتجر قريباً')}><Eye size={18} /></button>
                    <button title="تجميد المتجر" className={`${styles.actionIcon} ${styles.freeze}`} onClick={() => alert('إيقاف تجميد المتاجر غير مفعل في وضع العرض')}><ShieldOff size={18} /></button>
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
