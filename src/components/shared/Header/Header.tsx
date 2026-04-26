'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Globe, ShoppingCart, ClipboardList, ShoppingBag, LayoutDashboard, Package } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useCartStore } from '@/lib/store';
import Image from 'next/image';
import CurrencySwitcher from '@/components/shared/CurrencySwitcher/CurrencySwitcher';
import { triggerHaptic } from '@/lib/utils';
import styles from './Header.module.css';

interface HeaderProps {
  storeName: string;
  storeLogo?: string | null;
  isLanding?: boolean;
}

const Header: React.FC<HeaderProps> = ({ storeName, storeLogo, isLanding }) => {
  const t = useTranslations('Header');
  const locale = useLocale();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isSticky, setIsSticky] = React.useState(false);
  
  // Derive storeSlug from pathname if it's a store page
  const pathParts = pathname.split('/');
  const storeSlug = pathParts.includes('store') ? pathParts[pathParts.indexOf('store') + 1] : '';

  // Hydration safety
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsSticky(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isStore = !isLanding;
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  if (!mounted) {
    return (
      <header className={`${styles.header} ${isLanding ? styles.landingHeader : ''}`}>
        <div className={styles.container}>
          <div className={styles.logo}>{storeName}</div>
          <div className={styles.nav}></div>
        </div>
      </header>
    );
  }

  return (
    <motion.header 
      className={`${styles.header} ${isSticky ? styles.stickyHeader : ''} ${isLanding ? styles.landingHeader : ''}`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className={styles.container}>
        <motion.div 
          className={styles.logoWrapper}
          whileHover={{ scale: 1.02 }}
        >
          <Link href={isLanding ? `/${locale}` : `/${locale}/store/${storeSlug}`} className={styles.logo}>
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className={styles.logoImage} />
            ) : (
              <span className={styles.logoText}>{storeName}</span>
            )}
          </Link>
        </motion.div>

        <nav className={styles.actions}>
          {isStore && (
            <>
              <Link href={`/${locale}/orders`} className={styles.navLink} onClick={() => triggerHaptic('light')}>
                <ShoppingBag size={18} />
                <span className={styles.hideOnMobile}>{t('myOrders')}</span>
              </Link>
              <Link href={`/${locale}/track`} className={styles.navLink} onClick={() => triggerHaptic('light')}>
                <Package size={18} />
                <span className={styles.hideOnMobile}>{t('trackOrder')}</span>
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={`/${locale}/cart`} className={styles.cartLink} onClick={() => triggerHaptic('medium')}>
                  <div className={styles.iconWithBadge}>
                    <ShoppingCart size={20} />
                    <AnimatePresence>
                      {totalItems > 0 && (
                        <motion.span 
                          className={styles.cartCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                        >
                          {totalItems}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className={styles.hideOnMobile}>{t('cart')}</span>
                </Link>
              </motion.div>
            </>
          )}

          {isLanding && (
            <div className={styles.landingActions}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={`/${locale}/admin/dashboard`} className={styles.adminLink}>
                   <LayoutDashboard size={18} />
                   <span className={styles.adminText}>{t('adminLogin')}</span>
                </Link>
              </motion.div>
              
              <div className={styles.miniActions}>
                <button 
                  className={styles.themeToggle} 
                  onClick={() => { toggleTheme(); triggerHaptic('light'); }}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <Link 
                  href={pathname.replace(`/${locale}`, `/${nextLocale}`)} 
                  className={styles.localeLink} 
                  onClick={() => triggerHaptic('light')}
                >
                   <Globe size={18} />
                   <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
