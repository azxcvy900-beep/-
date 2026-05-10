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
import { 
  getStoreOrders, 
  getStoreInfo, 
  StoreInfo, 
  getStoreReviews,
  getMerchantBalance,
  createPayoutRequest,
  getPlatformSettings,
  getAllPayoutRequests,
  PayoutRequest
} from '@/lib/api';
import { Order } from '@/lib/store';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { StatSkeleton, TableSkeleton } from '@/components/shared/Skeletons/Skeletons';
import styles from './wallet.module.css';
import { toast } from 'sonner';

export default function WalletPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  // SWR Initial Fetches
  const { data: orders, loading: ordersLoading } = useStreamingFetch(
    () => getStoreOrders(storeSlug || 'demo'), 
    [storeSlug],
    `orders_${storeSlug || 'demo'}`
  );
  
  const { data: storeInfo } = useStreamingFetch(
    () => getStoreInfo(storeSlug || 'demo'), 
    [storeSlug],
    `store_${storeSlug || 'demo'}`
  );

  // Transaction Ledger (from orders)
  const transactions = React.useMemo(() => {
    return (orders || []).map((o: Order) => ({
      id: o.id,
      date: o.date,
      amount: o.total,
      type: 'sale',
      status: o.status,
      customer: o.address.fullName,
      isLocked: o.isPriceLocked
    })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  const { visibleItems: visibleTransactions } = useProgressiveLoad(transactions, 5, 100);

  const { data: platformSettings } = useStreamingFetch(
    () => getPlatformSettings(),
    [],
    'platform_settings'
  );

  const [realBalance, setRealBalance] = useState(0);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (storeSlug) {
      getMerchantBalance(storeSlug).then(setRealBalance);
      getAllPayoutRequests().then(all => {
        setPayouts(all.filter(p => p.storeSlug === storeSlug));
      });
    }
  }, [storeSlug, orders]);

  const activeOrders = (orders || []).filter((o: Order) => o.status !== 'cancelled');
  const totalSales = activeOrders.reduce((sum: number, o: Order) => sum + o.total, 0);
  const confirmedSales = activeOrders.filter((o: Order) => o.status === 'delivered').reduce((sum: number, o: Order) => sum + o.total, 0);
  
  const commissionRate = platformSettings?.commissionRate || platformSettings?.platformFee || 0;
  const estimatedCommission = (confirmedSales * commissionRate) / 100;
  const netAvailable = confirmedSales - estimatedCommission;

  const handleRequestPayout = async () => {
    if (payoutAmount <= 0 || payoutAmount > netAvailable) {
      toast.error('مبلغ غير صحيح');
      return;
    }

    if (!storeInfo?.paymentSettings?.bankDetails) {
      toast.error('يرجى ضبط بيانات الحساب البنكي في الإعدادات أولاً');
      return;
    }

    setPayoutLoading(true);
    try {
      await createPayoutRequest({
        merchantId: storeInfo.merchantId || '',
        storeSlug: storeSlug || '',
        amount: payoutAmount,
        currency: 'YER',
        bankAccount: storeInfo.paymentSettings.bankDetails
      });
      toast.success('تم إرسال طلب السحب بنجاح');
      setShowPayoutModal(false);
      // Refresh payouts
      const all = await getAllPayoutRequests();
      setPayouts(all.filter(p => p.storeSlug === storeSlug));
    } catch (error) {
      toast.error('فشل إرسال الطلب');
    } finally {
      setPayoutLoading(false);
    }
  };



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
        {ordersLoading && !orders ? (
          Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <motion.div whileHover={{ scale: 1.02 }} className={`${styles.balanceCard} ${styles.total}`}>
              <div className={styles.cardHeader}>
                <span>إجمالي المبيعات</span>
                <TrendingUp size={20} />
              </div>
              <h2>{totalSales.toLocaleString()} <small>ر.ي</small></h2>
              <p>تراكمي منذ بدء المتجر</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${styles.balanceCard} ${styles.available}`}>
              <div className={styles.cardHeader}>
                <span>صافي الرصيد المتاح</span>
                <CheckCircle2 size={20} />
              </div>
              <h2>{netAvailable.toLocaleString()} <small>ر.ي</small></h2>
              <p>بعد خصم عمولة المنصة ({commissionRate}%)</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className={`${styles.balanceCard} ${styles.pending}`}>
              <div className={styles.cardHeader}>
                <span>العمولات المستحقة</span>
                <DollarSign size={20} />
              </div>
              <h2>{estimatedCommission.toLocaleString()} <small>ر.ي</small></h2>
              <p>مبالغ تخصم لصالح المنصة</p>
            </motion.div>
          </>
        )}
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
                <TableSkeleton rows={5} />
              ) : visibleTransactions.length > 0 ? (
                visibleTransactions.map((tx: any) => (
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
          <p>بإمكانك طلب سحب المبلغ المتاح إلى حسابك البنكي أو الكريمي المسجل في الإعدادات.</p>
          <button 
            className={styles.withdrawBtn} 
            disabled={netAvailable <= 0}
            onClick={() => {
              setPayoutAmount(netAvailable);
              setShowPayoutModal(true);
            }}
          >
            طلب سحب {netAvailable.toLocaleString()} ر.ي
          </button>
        </div>
      </div>

      {payouts.length > 0 && (
        <div className={styles.payoutHistory}>
          <h3><History size={20} /> طلبات السحب السابقة</h3>
          <div className={styles.payoutGrid}>
            {payouts.map(p => (
              <div key={p.id} className={styles.payoutCard}>
                <div className={styles.payoutHeader}>
                  <span className={styles.payoutAmount}>{p.amount.toLocaleString()} {p.currency}</span>
                  <span className={`${styles.payoutStatus} ${styles[p.status]}`}>
                    {p.status === 'pending' ? 'قيد الانتظار' : p.status === 'processed' ? 'تم التحويل' : 'مرفوض'}
                  </span>
                </div>
                <div className={styles.payoutDate}>
                  {new Date(p.requestedAt).toLocaleDateString('ar-YE')}
                </div>
                {p.receiptUrl && (
                  <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className={styles.receiptLink}>
                    عرض إيصال التحويل
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className={styles.modalOverlay}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>تأكيد طلب السحب</h2>
              <button onClick={() => setShowPayoutModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.payoutSummary}>
                <label>المبلغ المطلوب سحبه:</label>
                <input 
                  type="number" 
                  value={payoutAmount} 
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  max={netAvailable}
                />
              </div>
              <div className={styles.bankInfoPreview}>
                <p>سيتم التحويل إلى:</p>
                <strong>{storeInfo?.paymentSettings?.bankDetails?.bankName}</strong>
                <span>{storeInfo?.paymentSettings?.bankDetails?.accountNumber}</span>
              </div>
              <p className={styles.notice}>سيتم مراجعة الطلب من قبل الإدارة ومعالجته خلال 24 ساعة.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowPayoutModal(false)}>إلغاء</button>
              <button className={styles.confirmBtn} disabled={payoutLoading} onClick={handleRequestPayout}>
                {payoutLoading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
