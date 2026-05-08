'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ExternalLink,
  Calendar,
  Clock,
  Package,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllPlatformOrders } from '@/lib/api';
import { Order } from '@/lib/store';
import styles from './orders.module.css';

export default function PlatformOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getAllPlatformOrders();
        setOrders(data);
      } catch (error) {
        console.error("Error loading platform orders:", error);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.address.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className={styles.loading}>جاري جلب كافة الطلبات...</div>;

  return (
    <div className={styles.ordersPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1>الرقابة العالمية على الطلبات</h1>
          <p>مراقبة كافة عمليات الشراء التي تتم عبر المنصة في جميع المتاجر.</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="البحث برقم الطلب أو اسم العميل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div className={styles.noData}>لا توجد طلبات مطابقة للبحث.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>المتجر</th>
                  <th>العميل</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td><span className={styles.orderId}>#{order.id}</span></td>
                    <td>
                      <div className={styles.storeTag}>
                        {order.storeSlug || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.customerInfo}>
                        <strong>{order.address.fullName}</strong>
                        <span>{order.address.phone}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.amount}>
                        {order.total.toLocaleString()} {order.currency || 'YER'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCol}>
                        <Calendar size={12} />
                        {new Date(order.date).toLocaleDateString('ar-YE')}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                        {order.status === 'pending' ? 'قيد الانتظار' : 
                         order.status === 'processing' ? 'جاري التجهيز' :
                         order.status === 'shipped' ? 'تم الشحن' :
                         order.status === 'delivered' ? 'تم التوصيل' : 'ملغي'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
