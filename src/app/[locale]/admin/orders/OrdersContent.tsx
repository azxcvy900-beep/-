'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  ExternalLink,
  ChevronRight,
  Printer,
  MessageSquare,
  Lock,
  Send,
  X,
  Loader2,
  Banknote,
  Landmark,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getStoreOrders, 
  updateOrderStatus, 
  getStoreInfo, 
  StoreInfo,
  subscribeToStoreOrders 
} from '@/lib/api';
import { Order } from '@/lib/store';
import { getWhatsAppUrl, WhatsAppMessageType } from '@/lib/whatsapp';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { TableSkeleton } from '@/components/shared/Skeletons/Skeletons';
import UsageGuard from '@/components/shared/UsageGuard/UsageGuard';
import styles from './orders.module.css';

type PaymentGroup = 'cod' | 'bank' | 'card';

export default function OrdersContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  const [localOrders, setLocalOrders] = useState<Order[] | null>(null);
  const [activeGroup, setActiveGroup] = useState<PaymentGroup>('cod');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [waOrder, setWaOrder] = useState<Order | null>(null);
  const [waType, setWaType] = useState<WhatsAppMessageType>('confirm_payment');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const { data: initialOrders, loading: ordersLoading } = useStreamingFetch(
    () => getStoreOrders(storeSlug || 'demo'), 
    [storeSlug],
    `orders_${storeSlug || 'demo'}`
  );

  const { data: storeInfo } = useStreamingFetch(
    () => getStoreInfo(storeSlug || 'demo'), 
    [storeSlug],
    `store_${storeSlug || 'demo'}`
  );

  const orderCount = storeInfo?.orderCountMonth || 0;
  const plan = storeInfo?.planType || 'free';
  const isLocked = plan === 'free' && orderCount >= 15;

  useEffect(() => {
    if (!storeSlug) return;
    const unsubscribe = subscribeToStoreOrders(storeSlug, (updatedOrders) => {
      setLocalOrders(updatedOrders);
    });
    return () => unsubscribe();
  }, [storeSlug]);

  useEffect(() => {
    if (initialOrders && !localOrders) {
      setLocalOrders(initialOrders);
    }
  }, [initialOrders, localOrders]);

  const filteredByGroup = (localOrders || []).filter(order => {
    if (activeGroup === 'cod') return order.paymentMethod === 'cod';
    if (activeGroup === 'bank') return order.paymentMethod === 'bank' || order.paymentMethod === 'transfer';
    if (activeGroup === 'card') return order.paymentMethod === 'card' || order.paymentMethod === 'stripe';
    return true;
  });

  const { visibleItems: visibleOrders } = useProgressiveLoad(filteredByGroup, 5, 100);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    setLocalOrders(prev => 
      prev ? prev.map((o: Order) => o.id === orderId ? { ...o, status: newStatus } : o) : null
    );
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      alert("حدث خطأ أثناء تحديث حالة الطلب.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock size={18} />;
      case 'processing': return <Package size={18} />;
      case 'shipped': return <Truck size={18} />;
      case 'delivered': return <CheckCircle2 size={18} />;
      case 'cancelled': return <XCircle size={18} />;
      default: return null;
    }
  };

  const statusOptions: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'جاري التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const handleWhatsApp = (order: Order) => {
    setWaOrder(order);
    setWaType(order.status === 'pending' && order.paymentMethod !== 'cod' ? 'confirm_payment' : 'status_update');
  };

  const confirmWhatsApp = () => {
    if (!waOrder || !storeInfo) return;
    const url = getWhatsAppUrl(waOrder, storeInfo, waType);
    window.open(url, '_blank');
    setWaOrder(null);
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `
      <html>
        <head>
          <title>فاتورة طلب #${order.id.slice(-8)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 40px; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #eee; padding: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header"><h1>${storeInfo?.name || 'BUYERS'}</h1></div>
          <h2>فاتورة طلب #${order.id}</h2>
          <p>العميل: ${order.address.fullName}</p>
          <p>التاريخ: ${new Date(order.date).toLocaleDateString('ar-YE')}</p>
          <table>
            <thead><tr><th>المنتج</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
            <tbody>${order.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${(i.price * i.quantity).toLocaleString()} ر.ي</td></tr>`).join('')}</tbody>
          </table>
          <h3>الإجمالي: ${order.total.toLocaleString()} ر.ي</h3>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className={styles.ordersPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة الطلبات</h1>
      </div>

      <div className={styles.tabsContainer}>
         <button 
           className={`${styles.tabBtn} ${activeGroup === 'cod' ? styles.tabActive : ''}`}
           onClick={() => setActiveGroup('cod')}
         >
           <Banknote size={18} />
           <span>الدفع عند الاستلام</span>
           <span className={styles.tabBadge}>{(localOrders || []).filter(o => o.paymentMethod === 'cod').length}</span>
         </button>
         <button 
           className={`${styles.tabBtn} ${activeGroup === 'bank' ? styles.tabActive : ''}`}
           onClick={() => setActiveGroup('bank')}
         >
           <Landmark size={18} />
           <span>التحويل البنكي</span>
           <span className={styles.tabBadge}>{(localOrders || []).filter(o => o.paymentMethod === 'bank' || o.paymentMethod === 'transfer').length}</span>
         </button>
         <button 
           className={`${styles.tabBtn} ${activeGroup === 'card' ? styles.tabActive : ''}`}
           onClick={() => setActiveGroup('card')}
         >
           <CreditCard size={18} />
           <span>ماستركارد</span>
           <span className={styles.tabBadge}>{(localOrders || []).filter(o => o.paymentMethod === 'card' || o.paymentMethod === 'stripe').length}</span>
         </button>
      </div>

      <div className={styles.listSection}>
        <Suspense fallback={<div className={styles.loadingCenter}><Loader2 className="animate-spin" size={40} /></div>}>
          {ordersLoading && visibleOrders.length === 0 ? (
            <TableSkeleton rows={3} />
          ) : visibleOrders.length > 0 ? (
            <div className={styles.ordersList}>
              {visibleOrders.map((order: Order) => (
                <motion.div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderId}>#{order.id.slice(-8)}</span>
                      <span className={styles.orderDate}>{new Date(order.date).toLocaleString(locale)}</span>
                    </div>
                    <div className={`${styles.statusBadge} ${styles[order.status]}`}>
                      {getStatusIcon(order.status)}
                      <span>{getStatusLabel(order.status)}</span>
                    </div>
                  </div>

                  <div className={styles.orderContent}>
                    <div className={styles.customerSection}>
                      <h4><User size={14} /> العميل</h4>
                      <p>{order.address.fullName}</p>
                      <span>{order.address.phone}</span>
                      <div className={styles.addressLine}>
                        <MapPin size={14} />
                        <span>{order.address.city}, {order.address.region}</span>
                      </div>
                    </div>

                    <div className={styles.itemsSection}>
                      <h4><Package size={14} /> المنتجات</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.itemLine}>
                          <span>{item.quantity}x {item.name}</span>
                          <span>{(item.price * item.quantity).toLocaleString()} ر.ي</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.paymentSection}>
                       <h4><CreditCard size={14} /> الدفع</h4>
                       <p>{activeGroup === 'cod' ? 'نقداً عند الاستلام' : activeGroup === 'bank' ? 'حوالة بنكية' : 'بطاقة ائتمان'}</p>
                       {order.paymentProof && (
                         <div className={styles.paymentReceipt} onClick={() => window.open(order.paymentProof, '_blank')}>
                            <img src={order.paymentProof} />
                         </div>
                       )}
                    </div>
                  </div>

                  <div className={styles.orderFooter}>
                    <div className={styles.totalPrice}>{order.total.toLocaleString()} ر.ي</div>
                    <div className={styles.actions}>
                      <button className={styles.whatsappBtn} onClick={() => handleWhatsApp(order)}><MessageSquare size={18} /></button>
                      <button className={styles.printBtn} onClick={() => handlePrint(order)}><Printer size={18} /></button>
                      <select 
                        className={styles.statusDropdown}
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                      >
                        {statusOptions.map(opt => <option key={opt} value={opt}>{getStatusLabel(opt)}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyOrders}>لا توجد طلبات في هذا القسم حالياً.</div>
          )}
        </Suspense>
      </div>

      <AnimatePresence>
        {waOrder && (
          <div className={styles.modalOverlay}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>إرسال تنبيه واتساب</h3>
                <button onClick={() => setWaOrder(null)}><X size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <button 
                  className={`${styles.waTypeBtn} ${waType === 'confirm_payment' ? styles.waTypeBtnActive : ''}`}
                  onClick={() => setWaType('confirm_payment')}
                >تأكيد الطلب والدفع</button>
                <button 
                  className={`${styles.waTypeBtn} ${waType === 'status_update' ? styles.waTypeBtnActive : ''}`}
                  onClick={() => setWaType('status_update')}
                >تحديث الحالة</button>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.confirmWaBtn} onClick={confirmWhatsApp}><Send size={16} /> فتح واتساب</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
