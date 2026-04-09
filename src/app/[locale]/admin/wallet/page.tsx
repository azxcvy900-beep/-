'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  CheckCircle2, 
  History,
  TrendingUp,
  Download,
  Filter,
  DollarSign,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoreOrders, getStoreInfo, StoreInfo, getStoreReviews } from '@/lib/api';
import { Order } from '@/lib/store';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import styles from './wallet.module.css';

export default function WalletPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  // Use independent streaming fetches
  const { data: orders, loading: ordersLoading } = useStreamingFetch(
    () => getStoreOrders(storeSlug || 'demo'), [storeSlug]
  );
  const { data: storeInfo, loading: infoLoading } = useStreamingFetch(
    () => getStoreInfo(storeSlug || 'demo'), [storeSlug]
  );

  // Transaction Ledger (from orders)
  const transactions = React.useMemo(() => {
    return (orders || []).map(o => ({
      id: o.id,
      date: o.date,
      amount: o.total,
      type: 'sale',
      status: o.status,
      customer: o.address.fullName,
      isLocked: o.isPriceLocked
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  const { visibleItems: visibleTransactions } = useProgressiveLoad(transactions, 5, 100);

  const activeOrders = (orders || []).filter(o => o.status !== 'cancelled');
  const totalBalanceYER = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const confirmedBalanceYER = activeOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const pendingBalanceYER = totalBalanceYER - confirmedBalanceYER;



  return (
    <div className={styles.walletPage}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.titleArea}>
          <Wallet size={32} />
          <div>
            <h1>المحفظة المالية للتاجر</h1>
            <p>إدارة الرصيد والتحويلات البنكية لمتجر {storeInfo?.name}</p>
          </div>
        </div>
        <button className={styles.exportBtn}>
          <Download size={18} /> تصدير الكشف
        </button>
      </motion.div>

      <div className={styles.balanceGrid}>
        <motion.div whileHover={{ scale: 1.02 }} className={`${styles.balanceCard} ${styles.total}`}>
          <div className={styles.cardHeader}>
            <span>إجمالي المبيعات</span>
            <TrendingUp size={20} />
          </div>
          <h2>{totalBalanceYER.toLocaleString()} <small>ر.ي</small></h2>
          <p>تراكمي منذ بدء المتجر</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className={`${styles.balanceCard} ${styles.available}`}>
          <div className={styles.cardHeader}>
            <span>الرصيد المتاح (Confirmed)</span>
            <CheckCircle2 size={20} />
          </div>
          <h2>{confirmedBalanceYER.toLocaleString()} <small>ر.ي</small></h2>
          <p>جاهز للتسليم للتاجر</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className={`${styles.balanceCard} ${styles.pending}`}>
          <div className={styles.cardHeader}>
            <span>بانتظار التأكيد (Locked)</span>
            <Lock size={20} />
          </div>
          <h2>{pendingBalanceYER.toLocaleString()} <small>ر.ي</small></h2>
          <p>مبالغ قيد شحن الطلبات</p>
        </motion.div>
      </div>

      <div className={styles.ledgerSection}>
        <div className={styles.ledgerHeader}>
          <h3><History size={20} /> سجل العمليات المالية (Ledger)</h3>
          <div className={styles.filters}>
            <button className={styles.filterBtn}><Filter size={16} /> تصفية</button>
          </div>
        </div>

        <div className={styles.ledgerTableWrapper}>
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>نوع العملية</th>
                <th>رقم الطلب / العميل</th>
                <th>المبلغ</th>
                <th>الحالة المالية</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading && visibleTransactions.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</td></tr>
              ) : visibleTransactions.length > 0 ? (
                visibleTransactions.map((tx) => (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td>{new Date(tx.date).toLocaleDateString('ar-YE')}</td>
                    <td>
                      <div className={styles.typeTag}>
                        <ArrowUpCircle size={14} color="#10b981" />
                        مبيعات
                      </div>
                    </td>
                    <td>
                      <div className={styles.customerInfo}>
                        <strong>#{tx.id.slice(-6)}</strong>
                        <span>{tx.customer}</span>
                      </div>
                    </td>
                    <td className={styles.amount}>+{tx.amount.toLocaleString()} ر.ي</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[tx.status]}`}>
                        {tx.status === 'delivered' ? 'مؤكد ✅' : tx.isLocked ? 'مجمّد 🔒' : 'قيد الانتظار ⏳'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/${locale}/admin/orders`} className={styles.viewDetails}>
                        التفاصيل
                      </Link>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>! {!ordersLoading && "لا توجد عمليات مالية بعد."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.withdrawalSection}>
        <h3><ArrowDownCircle size={20} /> سحب الرصيد المتاح</h3>
        <div className={styles.withdrawalCard}>
          <p>بإمكانك طلب سحب المبلغ المتاح إلى حسابك البنكي أو الكريمي فور وصوله للرصيد المتاح.</p>
          <button className={styles.withdrawBtn} disabled={confirmedBalanceYER === 0}>
            طلب سحب {confirmedBalanceYER.toLocaleString()} ر.ي
          </button>
        </div>
      </div>
    </div>
  );
}
