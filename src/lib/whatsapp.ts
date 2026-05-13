import { Order } from './store';
import { StoreInfo } from './api';

export type WhatsAppMessageType = 'confirm_payment' | 'status_update' | 'custom';

export function getWhatsAppUrl(
  order: Order, 
  storeInfo: StoreInfo, 
  type: WhatsAppMessageType = 'status_update'
): string {
  const phone = order.address.phone.replace(/\D/g, '');
  const itemsList = order.items
    .map(item => `- ${item.name} (x${item.quantity})`)
    .join('%0A');

  let message = '';

  if (type === 'confirm_payment') {
    message = `*تأكيد الطلب والدفع - ${storeInfo.name}*%0A%0A` +
      `مرحباً ${order.address.fullName} 👋%0A` +
      `تم استلام طلبك رقم: #${order.id.slice(-6)}%0A%0A` +
      `*المنتجات:*%0A${itemsList}%0A%0A` +
      `*الإجمالي:* ${order.total.toLocaleString()} ر.ي%0A%0A` +
      `يرجى تحويل المبلغ وإرسال صورة السند هنا للبدء بتجهيز طلبك. ✅`;
  } else {
    message = `*تحديث طلب من ${storeInfo.name}*%0A%0A` +
      `مرحباً ${order.address.fullName}%0A` +
      `رقم الطلب: #${order.id.slice(-6)}%0A` +
      `الحالة: ${getStatusText(order.status)}%0A%0A` +
      `*المنتجات:*%0A${itemsList}%0A%0A` +
      `*الإجمالي:* ${order.total.toLocaleString()} ر.ي%0A%0A` +
      `شكراً لتسوقك معنا!`;
  }

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

/**
 * AUTOMATED WHATSAPP API (Sandbox Mode)
 * This function simulates sending an automated WhatsApp message via a provider like UltraMsg or Twilio.
 * In a real production environment, you would use fetch() to call the provider's API.
 */
export async function sendAutomatedWhatsApp(
  to: string, 
  message: string, 
  type: 'customer' | 'merchant' = 'customer'
): Promise<boolean> {
  const formattedPhone = to.replace(/\D/g, '');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log('----------------------------------------');
  console.log(`[WHATSAPP API - SANDBOX MODE]`);
  console.log(`To: +${formattedPhone} (${type.toUpperCase()})`);
  console.log(`Message:\n${message}`);
  console.log('----------------------------------------');

  // In production:
  /*
  const response = await fetch('https://api.ultramsg.com/instanceXXX/messages/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `token=YOUR_TOKEN&to=${formattedPhone}&body=${encodeURIComponent(message)}`
  });
  return response.ok;
  */

  return true;
}

export async function notifyCustomerOrderCreated(order: Order, storeInfo: StoreInfo) {
  const phone = order.address.phone;
  const itemsList = order.items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
  
  const message = `*تأكيد استلام الطلب - ${storeInfo.name}* 🛍️\n\n` +
    `مرحباً ${order.address.fullName}،\n` +
    `تم استلام طلبك بنجاح وجاري العمل عليه.\n\n` +
    `*رقم الطلب:* #${order.id.slice(-6)}\n` +
    `*الإجمالي:* ${order.total.toLocaleString()} ${order.currency || 'YER'}\n\n` +
    `سنقوم بإعلامك فور تغيير حالة الطلب. شكراً لتسوقك معنا! ✅`;

  await sendAutomatedWhatsApp(phone, message, 'customer');
}

export async function notifyMerchantNewOrder(order: Order, storeInfo: StoreInfo) {
  const phone = storeInfo.phone;
  const message = `*طلب جديد!* 🔔\n\n` +
    `تم استلام طلب جديد في متجرك (${storeInfo.name}).\n\n` +
    `*رقم الطلب:* #${order.id.slice(-6)}\n` +
    `*العميل:* ${order.address.fullName}\n` +
    `*القيمة:* ${order.total.toLocaleString()} ${order.currency || 'YER'}\n\n` +
    `يرجى مراجعة لوحة التحكم للتفاصيل.`;

  await sendAutomatedWhatsApp(phone, message, 'merchant');
}

export async function notifyCustomerOrderStatus(order: Order, storeInfo: StoreInfo) {
  const phone = order.address.phone;
  const message = `*تحديث حالة الطلب - ${storeInfo.name}* 📦\n\n` +
    `مرحباً ${order.address.fullName}،\n` +
    `نود إعلامك أن حالة طلبك رقم #${order.id.slice(-6)} قد تغيرت إلى:\n` +
    `*${getStatusText(order.status)}*\n\n` +
    `يمكنك تتبع طلبك عبر رابط المتجر. شكراً لك!`;

  await sendAutomatedWhatsApp(phone, message, 'customer');
}
