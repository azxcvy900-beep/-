'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Activity,
  Globe,
  MessageSquareWarning,
  Moon,
  Sun,
  Store,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSessionStore } from '@/lib/session-store';
import styles from './manager-layout.module.css';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Admin'); // Reusing some Admin translations where applicable
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, role, username, logout, _hasHydrated } = useSessionStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // If on login page, don't show the manager layout
  if (pathname.includes('/manager/login')) {
    return <>{children}</>;
  }

  // Delay auth check until both React has mounted and Zustand has read from localStorage
  if (!mounted || !_hasHydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ color: '#94a3b8' }}>جاري التحميل...</div>
      </div>
    );
  }

  // Redirect to manager login if not authenticated as admin
  if (!isLoggedIn || role !== 'admin') {
    return <RedirectToLogin locale={locale} />;
  }

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/manager/login`);
  };

  const navItems = [
    { name: 'الإدارة', href: `/${locale}/manager`, icon: ShieldAlert },
    { name: 'إدارة المتاجر', href: `/${locale}/manager/merchants`, icon: Store },
    { name: 'مركز البلاغات', href: `/${locale}/manager/complaints`, icon: Bell },
    { name: 'الإعدادات العالمية', href: `/${locale}/manager/settings`, icon: Settings },
  ];

  if (!mounted) return null;

  return (
    <div className={`${styles.managerContainer} ${theme === 'dark' ? styles.dark : styles.light}`}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href={`/${locale}/manager`} className={styles.logo}>
            <ShieldAlert size={28} className={styles.logoIcon} />
            <span>بايرز <span>بروتوكول</span></span>
          </Link>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
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
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>غرفة العمليات المركزية</h1>
              <p className={styles.subtitle}>تحليلات استراتيجية ورقابة عالمية للبروتوكول</p>
            </div>
          </div>
          
          <div className={styles.topBarRight}>
            <div className={styles.statusIndicator}>
              <div className={styles.pulseDot} />
              <span>نظام الرقابة: متصل</span>
            </div>
            
            <div className={styles.adminProfile}>
               <div className={styles.adminInfo}>
                 <p>المدير العام</p>
                 <span>{username || 'Super Admin'}</span>
               </div>
               <div className={styles.avatar}>
                 <User size={20} />
               </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/** Helper component that performs redirect inside useEffect */
function RedirectToLogin({ locale }: { locale: string }) {
  const router = useRouter();
  
  useEffect(() => {
    router.replace(`/${locale}/manager/login`);
  }, [router, locale]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      color: '#94a3b8',
      fontSize: '1.1rem',
      background: '#030712'
    }}>
      جاري التحويل لصفحة الدخول...
    </div>
  );
}
