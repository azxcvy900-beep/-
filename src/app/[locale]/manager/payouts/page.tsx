'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ExternalLink, 
  Upload, 
  MessageSquare,
  Search,
  Building,
  User,
  History,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAllPayoutRequests, 
  updatePayoutStatus, 
  PayoutRequest 
} from '@/lib/api';
import styles from '../manager.module.css';
import { toast } from 'sonner';

const PayoutManagement = () => {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const statusFilter = filter === 'all' ? undefined : filter;
      const data = await getAllPayoutRequests(statusFilter);
      setRequests(data);
    } catch (error) {
      toast.error('فشل جلب طلبات السحب');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'processed' | 'rejected') => {
    if (status === 'processed' && !receiptUrl) {
      toast.error('يرجى إرفاق رابط إيصال التحويل أولاً');
      return;
    }
    
    setActionLoading(true);
    try {
      await updatePayoutStatus(id, status, adminNote, receiptUrl);
      toast.success(status === 'processed' ? 'تم تأكيد الدفع بنجاح' : 'تم رفض الطلب');
      setSelectedRequest(null);
      setAdminNote('');
      setReceiptUrl('');
      fetchRequests();
    } catch (error) {
      toast.error('فشلت العملية');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.opsRoom}>
      <div className={styles.pulseHeader}>
        <div className={styles.titleInfo}>
          <h1>
            <CreditCard className={styles.pulseIcon} />
            إدارة طلبات سحب الأرباح
          </h1>
          <p>مراجعة طلبات التجار، التحقق من البيانات البنكية، وتأكيد التحويلات المالية.</p>
        </div>
      </div>

      <div className={styles.vSwitcher}>
        <button 
          className={filter === 'pending' ? styles.subActive : ''} 
          onClick={() => setFilter('pending')}
        >
          طلبات معلقة 
          <span>{requests.filter(r => r.status === 'pending').length}</span>
        </button>
        <button 
          className={filter === 'processed' ? styles.subActive : ''} 
          onClick={() => setFilter('processed')}
        >
          تمت معالجتها
        </button>
        <button 
          className={filter === 'all' ? styles.subActive : ''} 
          onClick={() => setFilter('all')}
        >
          الكل
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {requests.map((req) => (
            <motion.div 
              key={req.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                      {req.storeSlug.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">@{req.storeSlug}</h3>
                      <p className="text-xs text-slate-500">معرف التاجر: {req.merchantId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    req.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                    req.status === 'processed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'processed' ? 'مكتمل' : 'مرفوض'}
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{req.amount.toLocaleString()}</span>
                  <span className="text-sm font-bold text-slate-400">{req.currency}</span>
                </div>
              </div>

              <div className="p-6 flex-1 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Building size={12} /> بيانات الحساب البنكي
                  </p>
                  <p className="text-sm font-bold text-slate-700">{req.bankAccount.bankName}</p>
                  <p className="text-sm font-medium text-slate-600">{req.bankAccount.accountNumber}</p>
                  <p className="text-xs text-slate-500 italic">{req.bankAccount.accountName}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={12}/> {new Date(req.requestedAt).toLocaleDateString('ar-YE')}</span>
                  {req.status === 'processed' && <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={12}/> تم الدفع</span>}
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-3">
                {req.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                    >
                      معالجة الطلب
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-500 py-2 rounded-xl font-bold text-sm transition-all"
                    >
                      رفض
                    </button>
                  </>
                ) : (
                  <button 
                    className="w-full bg-slate-100 text-slate-500 py-2 rounded-xl font-bold text-sm cursor-default flex items-center justify-center gap-2"
                  >
                    {req.status === 'processed' ? <CheckCircle2 size={16}/> : <XCircle size={16}/>}
                    تم إغلاق الطلب
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {requests.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-[28px] border border-dashed border-slate-200 mt-8">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium italic">لا يوجد طلبات سحب في هذا القسم حالياً.</p>
        </div>
      )}

      {/* Process Payout Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-[#0f172a] text-white">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">تأكيد عملية الدفع</h2>
                  <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <XCircle size={24} />
                  </button>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10">
                  <p className="text-sm text-slate-400 mb-1">المبلغ المطلوب تحويله</p>
                  <p className="text-3xl font-black">{selectedRequest.amount.toLocaleString()} <span className="text-lg font-normal opacity-50">{selectedRequest.currency}</span></p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Building size={16} />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold">{selectedRequest.bankAccount.bankName}</p>
                      <p className="opacity-60">{selectedRequest.bankAccount.accountNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <Upload size={16} className="text-blue-500" /> رابط إيصال التحويل (رابط صورة)
                  </label>
                  <input 
                    type="text" 
                    placeholder="https://example.com/receipt.jpg"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 italic">يجب إرفاق صورة الإثبات ليتمكن التاجر من رؤيتها.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" /> ملاحظات إدارية (اختياري)
                  </label>
                  <textarea 
                    placeholder="اكتب ملاحظة للتاجر هنا..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedRequest.id, 'processed')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'جاري المعالجة...' : 'تأكيد إتمام الدفع'}
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedRequest.id, 'rejected')}
                    className="px-6 bg-rose-50 text-rose-500 hover:bg-rose-100 py-4 rounded-2xl font-bold transition-all"
                  >
                    رفض
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default PayoutManagement;
