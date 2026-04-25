'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Globe, ShoppingCart, ClipboardList, ShoppingBag, LayoutDashboard } from 'lucide-react';
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
  const ot = useTranslations('Orders');
  const locale = useLocale();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  // Hydration safety for Zustand persist
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <header className={`${styles.header} ${isLanding ? styles.landingHeader : ''}`}>
      <div className={styles.container}>
        <motion.div 
          initial={{ x: locale === 'ar' ? 20 : -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href={`/${locale}`} className={styles.logo} onClick={() => triggerHaptic('light')}>
            {storeLogo ? (
              <img 
                src={storeLogo} 
                alt={storeName} 
                className={styles.logoImage}
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
            ) : (
              storeName
            )}
          </Link>
        </motion.div>
        
        <nav className={styles.nav}>
          <motion.button 
            onClick={() => {
              triggerHaptic('light');
              toggleTheme();
            }} 
            className={`${styles.iconButton} ${isLanding ? styles.hideOnMobile : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -10, opacity: 0, rotate: 45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 10, opacity: 0, rotate: -45 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
 
          {!isLanding && (
            <>
              <Link href={`/${locale}/orders`} className={styles.navLink} onClick={() => triggerHaptic('light')}>
                <ShoppingBag size={18} />
                <span className={styles.hideOnMobile}>{t('myOrders')}</span>
              </Link>
              
              <Link href={`/${locale}/track`} className={styles.navLink} onClick={() => triggerHaptic('light')}>
                <ClipboardList size={18} />
                <span className={styles.hideOnMobile}>{t('trackOrder')}</span>
              </Link>
 
              <Link href={`/${locale}/cart`} className={styles.cartLink} onClick={() => triggerHaptic('medium')}>
                <ShoppingCart size={18} />
                <span className={`${styles.cartText} ${styles.hideOnMobile}`}>{t('cart')}</span>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span 
                      key="cart-badge"
                      className={styles.cartCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              
              <div className={styles.hideOnMobile} onClick={() => triggerHaptic('light')}>
                <CurrencySwitcher />
              </div>
            </>
          )}
 
          {isLanding && (
            <Link href={`/${locale}/admin/login`} className={styles.adminLink} onClick={() => triggerHaptic('medium')}>
              <LayoutDashboard size={18} />
              <span className={styles.hideOnMobile}>لوحة التحكم</span>
            </Link>
          )}
 
          <Link href={pathname.replace(`/${locale}`, `/${nextLocale}`)} className={`${styles.localeLink} ${isLanding ? styles.hideOnMobile : ''}`} onClick={() => triggerHaptic('medium')}>
            <Globe size={16} />
            <span className={styles.hideOnMobile}>{locale === 'ar' ? 'English' : 'العربية'}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
