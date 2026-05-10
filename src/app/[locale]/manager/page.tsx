'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  ChevronRight,
  Globe,
  Star,
  MessageSquareWarning,
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Phone,
  Landmark,
  X,
  Megaphone
} from 'lucide-react';
import BroadcastModal from '@/components/manager/BroadcastModal';

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
  Review,
  KYCRequest
} from '@/lib/api';

import { Order } from '@/lib/store';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import styles from './manager.module.css';

function SectionLoader({ label }: { label: string }) {
  return (
    <div className={styles.loading}>
      <Loader2 size={32} className="animate-spin mb-4" />
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

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

  const { visibleItems: visibleMerchants } = useProgressiveLoad(merchantRanking, 5, 100);
  
  const totalRevenue = (orders || []).reduce((sum: number, o: Order) => sum + o.total, 0);
  const activeMerchants = (stores || []).length;
  const criticalComplaints = (reviews || []).filter((r: Review) => r.rating <= 2).length;

  return (
    <div className={styles.opsRoom}>
      <header className={styles.pulseHeader}>
        <div className={styles.titleInfo}>
          <h1><ShieldCheck className={styles.pulseIcon} size={36} /> غرفة العمليات المركزية</h1>
          <p>مراقبة حية لنبض المنصة، أداء التجار، والتدفقات المالية.</p>
        </div>
        <div className={styles.tabs}>
            <button 
              className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl text-sm font-black hover:bg-amber-400 transition-all ml-6 shadow-lg shadow-amber-500/20"
              onClick={() => setIsBroadcastOpen(true)}
            >
              <Megaphone size={18} />
              إرسال تعميم
            </button>
            <button className={activeTab === 'radar' ? styles.tabActive : ''} onClick={() => setActiveTab('radar')}>
                <Activity size={18} /> الرادار الذكي
            </button>
            <button className={activeTab === 'approvals' ? styles.tabActive : ''} onClick={() => setActiveTab('approvals')}>
                <ShieldCheck size={18} /> طلبات KYC
                {kycRequests.length > 0 && <span className={styles.tabBadge}>{kycRequests.length}</span>}
            </button>
        </div>
      </header>

      <BroadcastModal 
        isOpen={isBroadcastOpen} 
        onClose={() => setIsBroadcastOpen(false)} 
      />

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
            <TrendingUp size={32} />
          </div>
          <div className={styles.statContent}>
            <p>إجمالي المبيعات (SAR)</p>
            <h3>{ordersLoading ? '...' : totalRevenue.toLocaleString()}</h3>
            <span className={styles.good}>+12.5% 📈</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Users size={32} />
          </div>
          <div className={styles.statContent}>
            <p>التجار النشطون</p>
            <h3>{storesLoading ? '...' : activeMerchants}</h3>
            <span className={styles.good}>+5.2% 👥</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <ShoppingBag size={32} />
          </div>
          <div className={styles.statContent}>
            <p>إجمالي الطلبات</p>
            <h3>{ordersLoading ? '...' : (orders || []).length}</h3>
            <span className={styles.good}>SAR</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
            <AlertTriangle size={32} />
          </div>
          <div className={styles.statContent}>
            <p>بلاغات معلقة</p>
            <h3>{reviewsLoading ? '...' : criticalComplaints}</h3>
            <span className={styles.negative}>عاجل ⚠️</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'radar' ? (
          <motion.div 
            key="radar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.mainGrid}
          >
            <div className={styles.radarList}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black">رادار المتاجر الذكي</h2>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Monitoring</span>
                </div>
                
                {(storesLoading || ordersLoading) && visibleMerchants.length === 0 && (
                  <SectionLoader label="جاري مسح المتاجر..." />
                )}
                
                {visibleMerchants.map((merchant: any) => (
                  <div key={merchant.slug} className={styles.radarItem}>
                    <div className={styles.merchantInfo}>
                       <img src={merchant.logo || '/favicon.ico'} alt={merchant.name} />
                       <div>
                         <h4>{merchant.name}</h4>
                         <span>/{merchant.slug}</span>
                       </div>
                    </div>
                    <div className={styles.merchantStats}>
                       <div className={styles.mStat}>
                          <small>المبيعات</small>
                          <p>{merchant.stats.revenue.toLocaleString()} ر.س</p>
                       </div>
                       <div className={styles.mStat}>
                          <small>الرضا</small>
                          <p className={merchant.stats.avgRating < 3 ? styles.bad : styles.good}>
                            <Star size={12} fill="currentColor" className="inline ml-1" /> 
                            {merchant.stats.avgRating.toFixed(1)}
                          </p>
                       </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className={styles.mapSection}>
              <div className={styles.mapWidget}>
                 <Globe size={180} className={styles.globeBg} />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className={styles.activeSpot} style={{ top: '40%', left: '60%' }} data-label="صنعاء: نشط" />
                    <div className={styles.activeSpot} style={{ top: '65%', left: '45%' }} data-label="عدن: نشط" />
                 </div>
              </div>
              
              <div className={styles.verificationPortal} style={{ padding: '24px' }}>
                <h4 className="font-black mb-4">أحدث البلاغات</h4>
                {(reviews || []).filter((r: any) => r.rating <= 2).slice(0, 3).map((r: any) => (
                    <div key={r.id} className="flex gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl mb-3">
                        <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-white mb-1">{r.customerName}</p>
                            <p className="text-xs text-slate-400">{r.comment}</p>
                        </div>
                    </div>
                ))}
                {(reviews || []).filter((r: any) => r.rating <= 2).length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-sm">لا توجد بلاغات حرجة حالياً ✅</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="approvals"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={styles.verificationPortal}
          >
            <div className={styles.vSwitcher}>
              <button className={styles.subActive}>التحقق من الهوية (KYC)</button>
            </div>

            <div className={styles.kycGrid}>
                {kycRequests.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 font-bold">لا توجد طلبات معلقة حالياً</div>
                ) : (
                  kycRequests.map(req => (
                    <div key={req.id} className={styles.radarItem} style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                        <div className={styles.merchantInfo}>
                            <div className="flex gap-4">
                                <img 
                                    src={req.identityUrl} 
                                    className="w-20 h-20 rounded-xl cursor-pointer hover:opacity-80" 
                                    onClick={() => setSelectedImage(req.identityUrl)}
                                    alt="ID"
                                />
                                <img 
                                    src={req.utilityBillUrl} 
                                    className="w-20 h-20 rounded-xl cursor-pointer hover:opacity-80" 
                                    onClick={() => setSelectedImage(req.utilityBillUrl)}
                                    alt="Bill"
                                />
                            </div>
                            <div className="mr-4">
                                <h4 className="text-white">متجر: {req.storeSlug}</h4>
                                <div className="flex gap-4 mt-2 text-slate-400 text-sm">
                                    <span className="flex items-center gap-1"><Phone size={14} /> {req.phone}</span>
                                    <span className="flex items-center gap-1"><Landmark size={14} /> {req.bankAccount}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className={styles.rejectBtn} onClick={() => handleKYCVerify(req, false)}>رفض</button>
                            <button className={styles.approveBtn} onClick={() => handleKYCVerify(req, true)}>تفعيل قانوني</button>
                        </div>
                    </div>
                  ))
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedImage && (
        <div className={styles.imageModal} onClick={() => setSelectedImage(null)}>
          <button className={styles.closeModalBtn} onClick={() => setSelectedImage(null)}>
            <X size={32} />
          </button>
          <img src={selectedImage} alt="Fullscreen Document" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
