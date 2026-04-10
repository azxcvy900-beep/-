'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  UsersRound, 
  Search, 
  Filter, 
  ShoppingBag, 
  CreditCard, 
  Calendar,
  ExternalLink,
  Phone,
  Mail,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/lib/session-store';
import { getStoreCustomers, Customer } from '@/lib/api';
import styles from './customers.module.css';

export default function CustomersPage() {
  const t = useTranslations('Admin');
  const { storeSlug } = useSessionStore();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (storeSlug) fetchCustomers();
  }, [storeSlug]);

  const fetchCustomers = async () => {
    try {
      const data = await getStoreCustomers(storeSlug!);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <UsersRound size={32} className={styles.icon} />
          <div>
            <h1>{t('customers.title')}</h1>
            <p>{t('customers.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search size={20} />
          <input 
            type="text" 
            placeholder={t('customers.searchPlaceholder')} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.stats}>
           <div className={styles.statChip}>
              <span className={styles.statLabel}>إجمالي العملاء:</span>
              <span className={styles.statValue}>{customers.length}</span>
           </div>
        </div>
      </div>

      <div className={styles.listArea}>
        {loading ? (
          <div className={styles.loading}>...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className={styles.empty}>
             <Search size={48} />
             <p>لم يتم العثور على عملاء يطابقون بحثك</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>معلومات التواصل</th>
                  <th>{t('customers.totalOrders')}</th>
                  <th>{t('customers.totalSpent')}</th>
                  <th>{t('customers.lastOrder')}</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, idx) => (
                  <motion.tr 
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <td>
                      <div className={styles.customerName}>
                        <div className={styles.avatar}>
                          {customer.name.charAt(0)}
                        </div>
                        <span>{customer.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        <div className={styles.infoSpan}><Phone size={14} /> {customer.phone}</div>
                        {customer.email && <div className={styles.infoSpan}><Mail size={14} /> {customer.email}</div>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.badge}>
                        <ShoppingBag size={14} />
                        {customer.totalOrders} طلبات
                      </div>
                    </td>
                    <td>
                      <div className={styles.spendAmount}>
                        {customer.totalSpent.toLocaleString()} <small>YER</small>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateInfo}>
                        <Calendar size={14} />
                        {new Date(customer.lastOrderDate).toLocaleDateString('ar-YE')}
                      </div>
                    </td>
                    <td>
                      <button className={styles.actionBtn}>
                         <ExternalLink size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
