'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Grid,
  Ticket,
  MessageSquare,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSessionStore } from '@/lib/session-store';
import OrderNotification from '@/components/shared/OrderNotification/OrderNotification';
import styles from './admin-layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [checkingStore, setCheckingStore] = useState(true);
  const { isLoggedIn, role, username, storeSlug, logout } = useSessionStore();
  
  const isSetupPage = pathname.includes('/admin/setup');
  const isLoginPage = pathname.includes('/admin/login');

  // Verify store existence for merchants
  useEffect(() => {
    if (isLoggedIn && role === 'merchant' && !isLoginPage) {
      // In a real app, we'd fetch the store by merchant ID here
      setCheckingStore(false);
    } else {
      setCheckingStore(false);
    }
  }, [isLoggedIn, role, isLoginPage]);

  // If on login page, don't show the dashboard layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated as merchant or admin
  if (!isLoggedIn || (role !== 'merchant' && role !== 'admin')) {
    return <RedirectToLogin locale={locale} />;
  }

  // FORCE Setup if no storeSlug and not on setup page
  if (role === 'merchant' && !storeSlug && !isSetupPage && !checkingStore) {
    return <RedirectToSetup locale={locale} />;
  }

  // Minimal layout for Setup Wizard
  if (isSetupPage) {
    return <div className={styles.minimalLayout}>{children}</div>;
  }

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/admin/login`);
  };

  const navItems = [
    { name: t('sidebar.dashboard'), href: `/${locale}/admin/dashboard`, icon: LayoutDashboard },
    { name: 'الأقسام', href: `/${locale}/admin/categories`, icon: Grid },
    { name: t('sidebar.products'), href: `/${locale}/admin/products`, icon: Package },
    { name: 'الكوبونات', href: `/${locale}/admin/coupons`, icon: Ticket },
    { name: 'التقييمات', href: `/${locale}/admin/reviews`, icon: MessageSquare },
    { name: t('sidebar.orders'), href: `/${locale}/admin/orders`, icon: ShoppingBag },
    { name: t('sidebar.settings'), href: `/${locale}/admin/settings`, icon: Settings },
  ];

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
        <Link href={`/${locale}`} className={styles.sidebarLogo}>
          <Store size={28} />
          <span>بايرز <span>آدمن</span></span>
        </Link>
        
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            <span>{t('sidebar.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.leftBar}>
            <button 
              className={styles.menuToggle}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <h2 className={styles.pageTitle}>
              {navItems.find(item => item.href === pathname)?.name || t('sidebar.dashboard')}
            </h2>
          </div>
          
          <div className={styles.userProfile}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{username || 'التاجر'}</p>
            </div>
            <div className={styles.avatar}>
              <User size={20} />
            </div>
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

/** Helper component that performs redirect inside useEffect */
function RedirectToLogin({ locale }: { locale: string }) {
  const router = useRouter();
  
  useEffect(() => {
    router.replace(`/${locale}/admin/login`);
  }, [router, locale]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#64748b' }}>
      جاري التحويل لصفحة الدخول...
    </div>
  );
}

/** Helper for setup redirection */
function RedirectToSetup({ locale }: { locale: string }) {
  const router = useRouter();
  
  useEffect(() => {
    router.replace(`/${locale}/admin/setup`);
  }, [router, locale]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#3b82f6' }}>
      جاري تحويلك لمساعد التأسيس...
    </div>
  );
}
