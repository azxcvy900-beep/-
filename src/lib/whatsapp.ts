import { Order } from './store';
import { StoreInfo } from './api';

export function getWhatsAppUrl(order: Order, storeInfo: StoreInfo): string {
  const phone = order.address.phone.replace(/\D/g, '');
  const merchantPhone = storeInfo.phone.replace(/\D/g, '');
  
  const itemsList = order.items
    .map(item => `- ${item.name} (x${item.quantity})`)
    .join('%0A');

  const message = `*تحديث طلب من ${storeInfo.name}*%0A%0A` +
    `مرحباً ${order.address.fullName}%0A` +
    `رقم الطلب: #${order.id.slice(-6)}%0A` +
    `الحالة: ${getStatusText(order.status)}%0A%0A` +
    `*المنتجات:*%0A${itemsList}%0A%0A` +
    `*الإجمالي:* ${order.total.toLocaleString()} ر.ي%0A%0A` +
    `شكراً لتسوقك معنا!`;

  return `https://wa.me/${phone}?text=${message}`;
}

export function getMerchantWhatsAppUrl(order: Order, storeInfo: StoreInfo): string {
  const merchantPhone = storeInfo.phone.replace(/\D/g, '');
  
  const message = `*طلب جديد من متجرك (%23${order.id.slice(-6)})*%0A%0A` +
    `العميل: ${order.address.fullName}%0A` +
    `رقم العميل: ${order.address.phone}%0A` +
    `الإجمالي: ${order.total.toLocaleString()} ر.ي%0A%0A` +
    `يرجى تأكيد الاستلام ومراجعة السند المرفق.`;

  return `https://wa.me/${merchantPhone}?text=${message}`;
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending': return 'قيد الانتظار ⏳';
    case 'processing': return 'جاري التجهيز 📦';
    case 'shipped': return 'تم الشحن 🚚';
    case 'delivered': return 'تم التوصيل ✅';
    case 'cancelled': return 'تم الإلغاء ❌';
    default: return status;
  }
}
