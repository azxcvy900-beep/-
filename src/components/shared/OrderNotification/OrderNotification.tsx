'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Bell } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { Order } from '@/lib/store';
import styles from './OrderNotification.module.css';

export default function OrderNotification({ storeSlug }: { storeSlug: string }) {
  const [notification, setNotification] = useState<Order | null>(null);
  const isFirstLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Hidden audio element for notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const ordersRef = collection(db, 'stores', storeSlug, 'orders');
    const q = query(ordersRef, orderBy('date', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      if (!snapshot.empty) {
        const newOrder = snapshot.docs[0].data() as Order;
        // Verify it's a very recent order (within last 30 seconds)
        const orderDate = new Date(newOrder.date).getTime();
        const now = Date.now();
        
        if (now - orderDate < 30000) {
          setNotification(newOrder);
          audioRef.current?.play().catch(e => console.log("Audio play blocked"));
          
          // Auto hide after 8 seconds
          setTimeout(() => {
            setNotification(null);
          }, 8000);
        }
      }
    });

    return () => unsubscribe();
  }, [storeSlug]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className={styles.toast}
        >
          <div className={styles.iconBox}>
            <Bell className={styles.bell} size={24} />
          </div>
          <div className={styles.content}>
            <h4 className={styles.title}>طلب جديد مستلم! 🚀</h4>
            <p className={styles.text}>
              العميل <strong>{notification.address.fullName}</strong> قام بطلب بقيمة {notification.total.toLocaleString()} ر.ي
            </p>
            <div className={styles.orderId}>#{notification.id.slice(-6)}</div>
          </div>
          <button className={styles.closeBtn} onClick={() => setNotification(null)}>
            <X size={18} />
          </button>
          
          <div className={styles.progressBar} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
