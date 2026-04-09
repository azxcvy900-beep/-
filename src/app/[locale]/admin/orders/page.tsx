'use client';

import React, { useEffect, useState } from 'react';
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
  X
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
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { TableSkeleton } from '@/components/shared/Skeletons/Skeletons';
import styles from './orders.module.css';

export default function MerchantOrders() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  const [localOrders, setLocalOrders] = useState<Order[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [waOrder, setWaOrder] = useState<Order | null>(null);
  
  // SWR Initial Load from cache
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

  // Real-time listener
  useEffect(() => {
    if (!storeSlug) return;
    const unsubscribe = subscribeToStoreOrders(storeSlug, (updatedOrders) => {
      setLocalOrders(updatedOrders);
    });
    return () => unsubscribe();
  }, [storeSlug]);

  // Sync SWR result to local state if real-time hasn't triggered yet
  useEffect(() => {
    if (initialOrders && !localOrders) {
      setLocalOrders(initialOrders);
    }
  }, [initialOrders, localOrders]);

  const { visibleItems: visibleOrders } = useProgressiveLoad(localOrders || [], 3, 100);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    // 1. Optimistic Update
    setLocalOrders(prev => 
      prev ? prev.map((o: Order) => o.id === orderId ? { ...o, status: newStatus } : o) : null
    );
    setUpdatingId(orderId);

    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      // Rollback on error
      alert("حدث خطأ أثناء تحديث حالة الطلب.");
      const freshData = await getStoreOrders(storeSlug || 'demo');
      setLocalOrders(freshData);
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
  };

  const confirmWhatsApp = () => {
    if (!waOrder || !storeInfo) return;
    const url = getWhatsAppUrl(waOrder, storeInfo);
    window.open(url, '_blank');
    setWaOrder(null);
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const lockedInfo = order.isPriceLocked && order.lockedExRate 
      ? `<div style="background:#f0faf7; border: 1px solid #10b981; padding: 12px; border-radius: 10px; margin-bottom: 20px; font-size: 14px; color: #065f46; font-weight: bold;">
          💰 تنبيه مالي: تم تجميد السعر عند سعر صرف (1 ريال سعودي = ${order.lockedExRate} ريال يمني) لضمان ثبات الفاتورة ومنع تضرر التاجر أو العميل.
         </div>`
      : '';

    const html = `
      <html>
        <head>
          <title>فاتورة طلب #${order.id.slice(-8)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; padding: 40px; color: #1e293b; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: 900; color: #3b82f6; letter-spacing: -1px; }
            .invoice-title { font-size: 32px; font-weight: 800; color: #1e293b; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .info-box h3 { font-size: 15px; color: #64748b; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; font-weight: 800; }
            .info-box p { font-weight: 600; margin: 6px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            th { text-align: right; padding: 14px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 800; }
            td { padding: 16px 14px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }
            .total-section { margin-right: auto; width: 320px; background: #fcfcfc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-weight: 600; font-size: 15px; }
            .final-total { font-size: 24px; font-weight: 900; color: #3b82f6; border-top: 2px solid #3b82f6; margin-top: 15px; padding-top: 15px; }
            .footer { text-align: center; margin-top: 60px; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 30px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">${storeInfo?.name || 'BUYERS PLATFORM'}</div>
            <div class="invoice-title">فاتورة طلب</div>
          </div>

          ${lockedInfo}

          <div class="info-grid">
            <div class="info-box">
              <h3>معلومات الفاتورة</h3>
              <p>رقم الطلب: #${order.id}</p>
              <p>تاريخ الطلب: ${new Date(order.date).toLocaleDateString('ar-YE')}</p>
              <p>طريقة الدفع: ${order.paymentMethod === 'electronic' ? 'بطاقة إلكترونية' : 'حوالة بنكية'}</p>
              ${order.isPriceLocked ? `<p style="color: #10b981;">الحالة المالية: مجمّد (ثابت)</p>` : ''}
            </div>
            <div class="info-box">
              <h3>بينات العميل</h3>
              <p>${order.address.fullName}</p>
              <p>${order.address.phone}</p>
              <p>${order.address.city}, ${order.address.region}</p>
              <p>${order.address.details}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <strong>${item.name}</strong>
                    ${item.selectedOptions ? `<br/><small style="color:#64748b">${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toLocaleString()} ر.ي</td>
                  <td>${(item.price * item.quantity).toLocaleString()} ر.ي</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>المجموع الفرعي</span>
              <span>${order.subtotal.toLocaleString()} ر.ي</span>
            </div>
            ${order.discountAmount ? `
              <div class="total-row" style="color: #ef4444;">
                <span>الخصم</span>
                <span>-${order.discountAmount.toLocaleString()} ر.ي</span>
              </div>
            ` : ''}
            <div class="total-row final-total">
              <span>إجمالي الطلب</span>
              <span>${order.total.toLocaleString()} ر.ي</span>
            </div>
          </div>

          <div class="footer">
            <p>شكراً لتسوقكم مع ${storeInfo?.name || 'متجر بايرز'}</p>
            <p>تم إنشاء هذه الفاتورة إلكترونياً وهي صالحة بدون كود توثيق.</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Total', 'Payment', 'Status', 'Locked Rate'];
    const rows = (localOrders || []).map((o: Order) => [
      o.id,
      new Date(o.date).toLocaleDateString(locale),
      o.address.fullName,
      o.address.phone,
      o.total,
      o.paymentMethod,
      o.status,
      o.lockedExRate || 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.ordersPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('orders.title')}</h1>
        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV}>
            تصدير CSV
          </button>
          <div className={styles.ordersCount}>
            إجمالي الطلبات: {localOrders?.length || 0}
          </div>
        </div>
      </div>

      <div className={styles.listSection}>
        {ordersLoading && visibleOrders.length === 0 ? (
          <TableSkeleton rows={3} />
        ) : visibleOrders.length > 0 ? (
          <div className={styles.ordersList}>
            {visibleOrders.map((order: Order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.orderCard}
              >
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.orderId}>#{order.id.slice(-8)}</span>
                      {order.isPriceLocked && (
                        <div className={styles.lockedBadge} title="هذا الطلب مجمّد ماليناً بسعر الصرف وقت الإيداع">
                          <Lock size={12} />
                          مجمّد
                        </div>
                      )}
                    </div>
                    <span className={styles.orderDate}>{new Date(order.date).toLocaleString(locale)}</span>
                  </div>
                  <div className={`${styles.statusBadge} ${styles[order.status]}`}>
                    {getStatusIcon(order.status)}
                    <span>{getStatusLabel(order.status)}</span>
                  </div>
                </div>

                <div className={styles.orderContent}>
                  <div className={styles.customerSection}>
                    <h4><User size={14} /> بيانات العميل</h4>
                    <div className={styles.customerInfo}>
                      <p>{order.address.fullName}</p>
                      <span>{order.address.phone}</span>
                      <div className={styles.addressLine}>
                        <MapPin size={14} />
                        <span>{order.address.city}, {order.address.region}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemsSection}>
                    <h4><Package size={14} /> المنتجات ({order.items.length})</h4>
                    <div className={styles.itemList}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.itemLine}>
                          <span className={styles.itemName}>
                            {item.quantity}x {item.name}
                          </span>
                          <span className={styles.itemTotal}>{(item.price * item.quantity).toLocaleString()} ر.ي</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.paymentSection}>
                    <h4><CreditCard size={14} /> سند الدفع</h4>
                    {order.paymentProof ? (
                      <div className={styles.paymentReceipt} onClick={() => window.open(order.paymentProof, '_blank')}>
                        <img src={order.paymentProof} alt="Receipt" />
                        <div className={styles.receiptOverlay}>عرض السند</div>
                      </div>
                    ) : (
                      <div className={styles.noReceipt}>
                        لا يوجد سند مرفق.
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.totalArea}>
                    <div className={styles.totalLabel}>
                      الإجمالي النهائي:
                      {order.isPriceLocked && (
                        <span className={styles.exchangeRateLabel}>
                           (سعر الصرف: {order.lockedExRate})
                        </span>
                      )}
                    </div>
                    <div className={styles.totalPrice}>{order.total.toLocaleString()} ر.ي</div>
                  </div>

                  <div className={styles.actions}>
                    <div className={styles.actionButtons}>
                      <button 
                        className={`${styles.actionBtn} ${styles.whatsappBtn}`}
                        onClick={() => handleWhatsApp(order)}
                        title="إرسال تنبيه واتساب"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.printBtn}`}
                        onClick={() => handlePrint(order)}
                        title="طباعة الفاتورة"
                      >
                        <Printer size={18} />
                      </button>
                    </div>
                    
                    <div className={styles.statusUpdateWrapper}>
                      <select 
                        className={styles.statusDropdown}
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt}>{getStatusLabel(opt)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyOrders}>
            {!ordersLoading && "لا توجد طلبات واردة حالياً."}
          </div>
        )}
      </div>

      {/* WhatsApp Confirmation Modal */}
      <AnimatePresence>
        {waOrder && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={styles.modal}
            >
              <div className={styles.modalHeader}>
                <h3>إرسال تنبيه واتساب</h3>
                <button onClick={() => setWaOrder(null)}><X size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <p>هل تريد إرسال تحديث حالة الطلب للعميل عبر واتساب؟</p>
                <div className={styles.waPreview}>
                  <strong>إلى:</strong> {waOrder.address.fullName} ({waOrder.address.phone})<br/>
                  <strong>الحالة:</strong> {getStatusLabel(waOrder.status)}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelModalBtn} onClick={() => setWaOrder(null)}>إلغاء</button>
                <button className={styles.confirmWaBtn} onClick={confirmWhatsApp}>
                  <Send size={16} /> إرسال الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
