'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter, Link } from '@/i18n/routing';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Store,
  LayoutGrid,
  Ticket,
  MessageSquare,
  UsersRound,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/lib/session-store';
import { useAuthStore } from '@/lib/auth-store';
import { getStoreInfo } from '@/lib/api';
import OrderNotification from '@/components/shared/OrderNotification/OrderNotification';
import NotificationBell from '@/components/shared/NotificationBell/NotificationBell';
import styles from './admin-layout.module.css';

export default function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, role, username, storeSlug: sessionSlug, logout, _hasHydrated } = useSessionStore();
  const { storeLogo, storeName, setStoreInfo } = useAuthStore();
  
  useEffect(() => {
    setMounted(true);
    // Auto-close sidebar on mobile
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);
  
  const isLoginPage = pathname.includes('/admin/login');

  useEffect(() => {
    if (sessionSlug && isLoggedIn) {
      getStoreInfo(sessionSlug).then(info => {
        if (info) setStoreInfo(info);
      });
    }
  }, [sessionSlug, isLoggedIn, setStoreInfo]);

  if (!mounted || !_hasHydrated) return null;
  if (isLoginPage) return <>{children}</>;

  const navItems = [
    { name: 'لوحة التحكم', href: `/admin/dashboard`, icon: LayoutDashboard },
    { name: 'المنتجات والأقسام', href: `/admin/products`, icon: Package },
    { name: 'الطلبات', href: `/admin/orders`, icon: ShoppingBag },
    { name: 'العملاء', href: `/admin/customers`, icon: UsersRound },
    { name: 'الإعدادات', href: `/admin/settings`, icon: Settings },
  ];

  return (
    <div className={styles.adminLayout}>
      <OrderNotification storeSlug={sessionSlug || 'demo'} />
      
      {/* Professional Modern Sidebar */}
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.sidebarHeader}>
           <Store size={28} color="#fbbf24" />
           <span className={styles.brandName}>بايرز آدمن</span>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname.includes(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navActive : ''}`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
           <button onClick={() => { logout(); router.push(`/${locale}/admin/login`); }} className={styles.logoutBtn}>
             <LogOut size={20} />
             <span>تسجيل الخروج</span>
           </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className={styles.topBarRight}>
             <NotificationBell />
             <div className={styles.userProfile}>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>{username || 'التاجر'}</p>
                  <p className={styles.userRole}>{role === 'admin' ? 'مدير المنصة' : 'تاجر'}</p>
                </div>
                <img 
                  src={storeLogo || 'https://ui-avatars.com/api/?name=Admin&background=fbbf24&color=000'} 
                  className={styles.avatar}
                  alt="avatar"
                />
             </div>
          </div>
        </header>

        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
