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
  Moon,
  Sun,
  Users,
  UsersRound,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';
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
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Collapsed by default as in image
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, role, username, storeSlug: sessionSlug, permissions, logout, _hasHydrated } = useSessionStore();
  const { storeSlug, storeLogo, storeName, setStoreInfo, verificationStatus } = useAuthStore();
  
  useEffect(() => {
    setMounted(true);
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

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/admin/login`);
  };

  const navItems = [
    { name: 'الرئيسية', href: `/admin/dashboard`, icon: LayoutDashboard },
    { name: 'المنتجات', href: `/admin/products`, icon: Package },
    { name: 'الأقسام', href: `/admin/categories`, icon: LayoutGrid },
    { name: 'الطلبات', href: `/admin/orders`, icon: ShoppingBag },
    { name: 'العملاء', href: `/admin/customers`, icon: UsersRound },
    { name: 'الإعدادات', href: `/admin/settings`, icon: Settings },
  ];

  return (
    <div className={styles.adminLayout}>
      <OrderNotification storeSlug={sessionSlug || 'demo'} />
      
      {/* Premium Compact Sidebar (Icons Only like the image) */}
      <aside className={styles.miniSidebar}>
        <div className={styles.miniLogo}>
           <Store size={24} color="#fbbf24" />
        </div>
        <nav className={styles.miniNav}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`${styles.miniNavItem} ${pathname.includes(item.href) ? styles.miniActive : ''}`}
              title={item.name}
            >
              <item.icon size={22} />
            </Link>
          ))}
        </nav>
        <div className={styles.miniFooter}>
           <button onClick={handleLogout} className={styles.miniLogout} title="تسجيل الخروج">
             <LogOut size={22} />
           </button>
        </div>
      </aside>

      <div className={styles.mainContent}>
        {/* Restructured Top Bar (User on Left, Logo on Right as in image) */}
        <header className={styles.premiumTopBar}>
          <div className={styles.userSection}>
            <div className={styles.avatarWrapper}>
              <img 
                src={storeLogo || 'https://ui-avatars.com/api/?name=Admin&background=fbbf24&color=000'} 
                alt="Profile" 
                className={styles.userAvatar}
              />
              <div className={styles.onlineStatus} />
            </div>
            <div className={styles.userNameInfo}>
              <p className={styles.welcomeText}>مرحباً بك،</p>
              <p className={styles.userDisplayName}>{username || 'أحمد محمد'}</p>
            </div>
            <div className={styles.topActions}>
               <NotificationBell />
            </div>
          </div>

          <nav className={styles.topNavTabs}>
            {navItems.slice(0, 4).map(item => (
               <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles.topNavLink} ${pathname.includes(item.href) ? styles.topNavActive : ''}`}
               >
                 {item.name}
               </Link>
            ))}
          </nav>

          <div className={styles.logoSection}>
            <Link href="/" className={styles.brandLogo}>
              <span>بايرز</span>
              <Store size={24} color="#fbbf24" />
            </Link>
          </div>
        </header>

        <main className={styles.pageBody}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
