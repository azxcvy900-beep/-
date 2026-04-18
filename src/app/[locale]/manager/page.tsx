'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Star,
  MessageSquareWarning,
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAllStores, 
  getAllPlatformOrders, 
  getAllPlatformReviews, 
  getPendingPayments,
  approveStoreSubscription,
  rejectStoreSubscription,
  StoreInfo,
  PaymentProof,
  Review
} from '@/lib/api';
import { Order } from '@/lib/store';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import styles from './manager.module.css';

function SectionLoader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      {label}
    </div>
  );
}

export default function AdministrationDashboard() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'radar' | 'approvals'>('radar');
  const [subTab, setSubTab] = useState<'payments' | 'kyc'>('kyc');
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [kycRequests, setKycRequests] = useState<KYCRequest[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: stores, loading: storesLoading } = useStreamingFetch(() => getAllStores(), [], 'all_stores');
  const { data: orders, loading: ordersLoading } = useStreamingFetch(() => getAllPlatformOrders(), [], 'all_orders');
  const { data: reviews, loading: reviewsLoading } = useStreamingFetch(() => getAllPlatformReviews(), [], 'all_reviews');

  useEffect(() => {
    fetchProofs();
    fetchKYC();
  }, []);

  const fetchProofs = async () => {
    const data = await getPendingPayments();
    setProofs(data);
  };

  const fetchKYC = async () => {
    const { getPendingKYCRequests } = await import('@/lib/api');
    const data = await getPendingKYCRequests();
    setKycRequests(data);
  };

  const handleVerify = async (proof: PaymentProof, approve: boolean) => {
    if (!confirm(approve ? 'تأكيد تفعيل المتجر واشتراكه؟' : 'هل أنت متأكد من رفض هذا الطلب؟')) return;
    setVerifyingId(proof.id);
    try {
      if (approve) {
        await approveStoreSubscription(proof.id, proof.storeSlug, proof.plan as any);
      } else {
        await rejectStoreSubscription(proof.id, proof.storeSlug);
      }
      fetchProofs();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleKYCVerify = async (request: KYCRequest, approve: boolean) => {
    let reason = '';
    if (!approve) {
      reason = prompt('يرجى ذكر سبب الرفض للتاجر:') || '';
      if (!reason) return;
    }
    
    if (!confirm(approve ? 'هل أنت متأكد من تفعيل هذا المتجر قانونياً؟' : 'تأكيد رفض الوثائق؟')) return;
    
    setVerifyingId(request.id);
    try {
      const { updateKYCStatus } = await import('@/lib/api');
      await updateKYCStatus(request.id, request.storeSlug, approve ? 'approved' : 'rejected', reason);
      fetchKYC();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  // Progressive rendering for merchants list
  const merchantRanking = React.useMemo(() => {
    if (!stores || !orders || !reviews) return [];
    return (stores as StoreInfo[]).map((store: StoreInfo) => {
      const storeOrders = (orders as Order[]).filter((o: Order) => o.items.some((i: any) => i.storeSlug === store.slug));
      const storeReviews = (reviews as Review[]).filter((r: Review) => r.storeSlug === store.slug);
      const revenue = storeOrders.reduce((sum: number, o: Order) => sum + o.total, 0);
      const avgRating = storeReviews.length > 0 
        ? storeReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / storeReviews.length 
        : 5;
      const complaints = storeReviews.filter((r: Review) => r.rating <= 2).length;
      return { ...store, stats: { revenue, avgRating, complaints, orderCount: storeOrders.length } };
    }).sort((a: any, b: any) => b.stats.revenue - a.stats.revenue);
  }, [stores, orders, reviews]);

  const { visibleItems: visibleMerchants } = useProgressiveLoad(merchantRanking, 3, 200);
  
  const complaintsToShow = React.useMemo(() => {
    return (reviews || []).filter((r: Review) => r.rating <= 3).slice(0, 5);
  }, [reviews]);
  const { visibleItems: visibleComplaints } = useProgressiveLoad(complaintsToShow, 2, 250);

  // Analytics
  const totalRevenue = (orders || []).reduce((sum: number, o: Order) => sum + o.total, 0);
  const activeMerchants = (stores || []).length;
  const criticalComplaints = (reviews || []).filter((r: Review) => r.rating <= 2).length;

  const stats = [
    { label: t('Admin.dashboard.totalSales'), value: ordersLoading ? '...' : `${totalRevenue.toLocaleString()} ر.ي`, icon: TrendingUp, delta: '+12%', color: '#3b82f6', ready: !ordersLoading },
    { label: 'التجار النشطون', value: storesLoading ? '...' : activeMerchants, icon: Users, delta: '+2', color: '#8b5cf6', ready: !storesLoading },
    { label: t('Admin.dashboard.totalOrders'), value: ordersLoading ? '...' : (orders || []).length, icon: ShoppingBag, delta: '+54', color: '#10b981', ready: !ordersLoading },
    { label: 'تحذيرات الرضا', value: reviewsLoading ? '...' : criticalComplaints, icon: AlertTriangle, delta: 'مستقر', color: '#ef4444', ready: !reviewsLoading },
  ];

  return (
    <div className={styles.opsRoom}>
      <div className={styles.pulseHeader}>
        <div className={styles.titleInfo}>
            <h1>{t('Manager.title')} <Activity size={24} className={styles.pulseIcon} /></h1>
            <p>{t('Manager.subtitle')}</p>
        </div>
        <div className={styles.tabs}>
            <button className={activeTab === 'radar' ? styles.tabActive : ''} onClick={() => setActiveTab('radar')}>
                {t('Manager.tabs.radar')}
            </button>
            <button className={activeTab === 'approvals' ? styles.tabActive : ''} onClick={() => setActiveTab('approvals')}>
                طلبات الموافقة
                {(proofs.length + kycRequests.length) > 0 && <span className={styles.tabBadge}>{proofs.length + kycRequests.length}</span>}
            </button>
        </div>
      </div>

      <div className={styles.statGrid}>
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={styles.statCard}
          >
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className={styles.statContent}>
              <p>{stat.label}</p>
              <h3 style={{ opacity: stat.ready ? 1 : 0.4, transition: 'opacity 0.3s' }}>{stat.value}</h3>
              <span className={typeof stat.delta === 'string' && stat.delta.startsWith('+') ? styles.positive : ''}>{stat.delta}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'radar' ? (
          <motion.div 
            key="radar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={styles.mainGrid}
          >
            <div className={styles.header}>
              <div className={styles.titleInfo}>
                <h2 className={styles.title}>ريدار المتاجر الذكي</h2>
                <p className={styles.subtitle}>الرقابة الشاملة والتحليل المتقدم حسب المبيعات</p>
              </div>
              <div className={styles.radarList}>
                {(storesLoading || ordersLoading) && visibleMerchants.length === 0 && (
                  <SectionLoader label="جاري تحميل بيانات المتاجر..." />
                )}
                {visibleMerchants.map((merchant: any, i: number) => (
                  <motion.div key={merchant.slug} className={styles.radarItem}>
                    <div className={styles.merchantInfo}>
                       <img src={merchant.logo} alt={merchant.name} />
                       <div>
                         <h4>{merchant.name}</h4>
                         <span>{merchant.slug}</span>
                       </div>
                    </div>
                    <div className={styles.merchantStats}>
                       <div className={styles.mStat}>
                          <small>المبيعات</small>
                          <p>{merchant.stats.revenue.toLocaleString()} ر.ي</p>
                       </div>
                       <div className={styles.mStat}>
                          <small>الرضا</small>
                          <p className={merchant.stats.avgRating < 3 ? styles.bad : styles.good}>
                            <Star size={12} fill="currentColor" /> {merchant.stats.avgRating.toFixed(1)}
                          </p>
                       </div>
                       <div className={styles.mStat}>
                          <small>الشكاوى</small>
                          <p className={merchant.stats.complaints > 0 ? styles.alert : ''}>{merchant.stats.complaints}</p>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className={styles.mapSection}>
              <div className={styles.sectionHeader}>
                <h3>{t('Admin.dashboard.recentOrders')}</h3>
              </div>
              <div className={styles.mapWidget}>
                 <Globe size={160} className={styles.globeBg} />
                 <div className={styles.mapOverlay}>
                    <div className={styles.activeSpot} style={{ top: '60%', left: '70%' }} data-label="صنعاء: 45 طلب" />
                    <div className={styles.activeSpot} style={{ top: '75%', left: '80%' }} data-label="عدن: 22 طلب" />
                 </div>
              </div>
              <div className={styles.complaintsBox}>
                <h4>أحدث تقارير رصد الشكاوى</h4>
                <div className={styles.complaintList}>
                  {visibleComplaints.map((r: Review) => (
                    <div key={r.id} className={styles.complaintItem}>
                       <MessageSquareWarning size={16} color="#ef4444" />
                       <div className={styles.compDetail}>
                          <p><strong>{r.customerName}</strong>: {r.comment}</p>
                          <small>متجر: {r.storeSlug}</small>
                       </div>
                    </div>
                  ))}
                  {visibleComplaints.length === 0 && <p className={styles.noData}>لا توجد شكاوى حالياً ✅</p>}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="approvals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={styles.verificationPortal}
          >
            <div className={styles.vSwitcher}>
              <button 
                className={subTab === 'kyc' ? styles.subActive : ''} 
                onClick={() => setSubTab('kyc')}
              >
                تحقق الهوية (KYC)
                {kycRequests.length > 0 && <span>{kycRequests.length}</span>}
              </button>
              <button 
                className={subTab === 'payments' ? styles.subActive : ''} 
                onClick={() => setSubTab('payments')}
              >
                تفعيلات الدفع
                {proofs.length > 0 && <span>{proofs.length}</span>}
              </button>
            </div>

            {subTab === 'kyc' ? (
              <div className={styles.kycQueue}>
                {kycRequests.length === 0 ? (
                  <div className={styles.emptyResults}>لا توجد طلبات هوية حالياً</div>
                ) : (
                  <div className={styles.kycGrid}>
                    {kycRequests.map(req => (
                      <div key={req.id} className={styles.kycCard}>
                        <div className={styles.kycDocs}>
                          <div className={styles.docMini}>
                            <img src={req.identityUrl} alt="ID" />
                            <a href={req.identityUrl} target="_blank">صورة الهوية <ExternalLink size={12}/></a>
                          </div>
                          <div className={styles.docMini}>
                            <img src={req.utilityBillUrl} alt="Bill" />
                            <a href={req.utilityBillUrl} target="_blank">فاتورة الخدمات <ExternalLink size={12}/></a>
                          </div>
                        </div>
                        <div className={styles.kycText}>
                           <h3>متجر: {req.storeSlug}</h3>
                           <div className={styles.kycFields}>
                             <p><Phone size={14}/> {req.phone}</p>
                             <p><Landmark size={14}/> {req.bankAccount}</p>
                           </div>
                           <div className={styles.vActions}>
                              <button className={styles.rejectBtn} disabled={verifyingId === req.id} onClick={() => handleKYCVerify(req, false)}>رفض</button>
                              <button className={styles.approveBtn} disabled={verifyingId === req.id} onClick={() => handleKYCVerify(req, true)}>تفعيل المتجر</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
                <div className={styles.proofsGrid}>
                    {proofs.map(proof => (
                        <div key={proof.id} className={styles.proofCard}>
                            <div className={styles.proofImageWrapper}>
                                <img src={proof.imageUrl} alt="Receipt" />
                                <div className={styles.imageOverlay}>
                                    <a href={proof.imageUrl} target="_blank"><ExternalLink size={20} /></a>
                                </div>
                            </div>
                            <div className={styles.proofDetails}>
                                <h3>{proof.storeSlug}</h3>
                                <div className={styles.planBadge}>{proof.plan.toUpperCase()}</div>
                                <p>{t('Tracking.date')}: {new Date(proof.date).toLocaleString('ar-YE')}</p>
                                
                                <div className={styles.vActions}>
                                    <button 
                                        className={styles.rejectBtn}
                                        onClick={() => handleVerify(proof, false)}
                                        disabled={verifyingId === proof.id}
                                    >
                                        <XCircle size={18} /> {t('Manager.verificationPortal.reject')}
                                    </button>
                                    <button 
                                        className={styles.approveBtn}
                                        onClick={() => handleVerify(proof, true)}
                                        disabled={verifyingId === proof.id}
                                    >
                                        <CheckCircle2 size={18} /> {verifyingId === proof.id ? '...' : t('Manager.verificationPortal.approve')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
