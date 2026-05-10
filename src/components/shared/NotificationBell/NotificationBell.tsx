'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserNotifications, markNotificationAsRead, AppNotification } from '@/lib/api';
import { useSessionStore } from '@/lib/session-store';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const { isLoggedIn, uid: merchantId } = useSessionStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userId = merchantId || 'admin_global'; // Fallback for manager

  useEffect(() => {
    if (isLoggedIn && userId) {
      loadNotifications();
    }
  }, [isLoggedIn, userId]);

  const loadNotifications = async () => {
    const role = (merchantId ? 'merchant' : 'admin') as any;
    const [privateData, globalData] = await Promise.all([
      getUserNotifications(userId),
      import('@/lib/api').then(m => m.getGlobalAnnouncements(role))
    ]);
    
    // Combine and sort by date
    const combined = [...privateData, ...globalData.map(g => ({
      ...g,
      type: 'system',
      isRead: false, // Global announcements are always "new" until read (could use local storage for this)
    }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setNotifications(combined as AppNotification[]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.bellBtn} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className={styles.badge}
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={styles.dropdown}
          >
            <div className={styles.header}>
              <h3>التنبيهات</h3>
              {unreadCount > 0 && <button onClick={() => notifications.forEach(n => !n.isRead && handleMarkAsRead(n.id))}>تحديد الكل كمقروء</button>}
            </div>

            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.empty}>لا توجد تنبيهات حالياً</div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`${styles.item} ${notif.isRead ? '' : styles.unread}`}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <div className={styles.itemContent}>
                      <p className={styles.itemTitle}>{notif.title}</p>
                      <p className={styles.itemMsg}>{notif.message}</p>
                      <span className={styles.itemDate}>
                        {new Date(notif.createdAt).toLocaleDateString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {notif.link && (
                      <Link href={notif.link} className={styles.itemLink}>
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
