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
  UsersRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSessionStore } from '@/lib/session-store';
import { useAuthStore } from '@/lib/auth-store';
import { getStoreInfo } from '@/lib/api';
import OrderNotification from '@/components/shared/OrderNotification/OrderNotification';
import styles from './admin-layout.module.css';

export default function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [checkingStore, setCheckingStore] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, role, username, storeSlug, permissions, logout } = useSessionStore();
  const { storeLogo, storeName, setStoreInfo } = useAuthStore();
  
  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isSetupPage = pathname.includes('/admin/setup');
  const isLoginPage = pathname.includes('/admin/login');

  // Sync session storeSlug with authStore
  useEffect(() => {
    if (storeSlug && isLoggedIn) {
      getStoreInfo(storeSlug).then(info => {
        if (info) setStoreInfo(info);
      });
    }
  }, [storeSlug, isLoggedIn, setStoreInfo]);

  // Verify access
  useEffect(() => {
    if (isLoggedIn && (role === 'merchant' || role === 'employee' || role === 'admin') && !isLoginPage) {
      setCheckingStore(false);
    } else {
      setCheckingStore(false);
    }
  }, [isLoggedIn, role, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isLoggedIn || (role !== 'merchant' && role !== 'admin' && role !== 'employee')) {
    return <RedirectToLogin locale={locale} />;
  }

  if (role === 'merchant' && !storeSlug && !isSetupPage && !checkingStore) {
    return <RedirectToSetup locale={locale} />;
  }

  if (isSetupPage) {
    return <div className={styles.minimalLayout}>{children}</div>;
  }

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/admin/login`);
  };

  const hasAll = permissions?.includes('all');

  const navItems = [
    { 
      name: t('sidebar.dashboard'), 
      href: `/admin/dashboard`, 
      icon: LayoutDashboard,
      show: true 
    },
    { 
      name: t('sidebar.categories'), 
      href: `/admin/categories`, 
      icon: LayoutGrid,
      show: hasAll || permissions?.includes('products.view') || role === 'admin' || role === 'merchant'
    },
    { 
      name: t('sidebar.products'), 
      href: `/admin/products`, 
      icon: Package,
      show: hasAll || permissions?.includes('products.view') || role === 'admin' || role === 'merchant'
    },
    { 
      name: t('sidebar.coupons'), 
      href: `/admin/coupons`, 
      icon: Ticket,
      show: hasAll || permissions?.includes('marketing.view') || role === 'admin' || role === 'merchant'
    },
    { 
      name: t('sidebar.reviews'), 
      href: `/admin/reviews`, 
      icon: MessageSquare,
      show: hasAll || permissions?.includes('reviews.view') || role === 'admin' || role === 'merchant'
    },
    { 
      name: t('sidebar.orders'), 
      href: `/admin/orders`, 
      icon: ShoppingBag,
      show: hasAll || permissions?.includes('orders.view') || role === 'admin' || role === 'merchant'
    },
    { 
      name: t('sidebar.customers'), 
      href: `/admin/customers`, 
      icon: UsersRound,
      show: hasAll || permissions?.includes('customers.view') || role === 'admin' || role === 'merchant'
    },
    { 
      name: t('sidebar.employees'), 
      href: `/admin/employees`, 
      icon: Users,
      show: role === 'merchant' || role === 'admin'
    },
    { 
      name: t('sidebar.settings'), 
      href: `/admin/settings`, 
      icon: Settings,
      show: hasAll || permissions?.includes('settings.manage') || role === 'admin' || role === 'merchant'
    },
  ];

  const visibleNavItems = navItems.filter(item => item.show);

  const isPathActive = (href: string) => {
    const cleanPath = pathname.replace(/\/$/, '') || '/';
    const cleanHref = href.replace(/\/$/, '') || '/';
    return cleanPath === cleanHref || cleanPath.startsWith(cleanHref + '/');
  };

  const currentItem = navItems.find(item => isPathActive(item.href));

  if (!mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)' }}>
        <div className="loader">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <OrderNotification storeSlug={storeSlug || 'demo'} />
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
        <Link href="/" className={styles.sidebarLogo}>
          <Store size={28} />
          <span>بايرز <span>آدمن</span></span>
        </Link>
        
        <nav className={styles.sidebarNav}>
          {visibleNavItems.map((item) => {
            const isActive = isPathActive(item.href);
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
              {currentItem?.name || t('sidebar.dashboard')}
            </h2>
          </div>
          
          <div className={styles.userProfile}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{username || 'التاجر'}</p>
            </div>
            <div className={styles.avatar}>
              {storeLogo ? (
                <img 
                  src={storeLogo} 
                  alt={storeName || ''} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={20} />
              )}
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

function RedirectToLogin({ locale }: { locale: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#64748b' }}>
      جاري التحويل لصفحة الدخول...
    </div>
  );
}

function RedirectToSetup({ locale }: { locale: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/setup');
  }, [router]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#3b82f6' }}>
      جاري تحويلك لمساعد التأسيس...
    </div>
  );
}
