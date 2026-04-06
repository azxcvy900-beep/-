'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Globe, ShoppingCart } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useCartStore } from '@/lib/store';
import styles from './Header.module.css';

interface HeaderProps {
  storeName: string;
}

const Header: React.FC<HeaderProps> = ({ storeName }) => {
  const t = useTranslations('Header');
  const locale = useLocale();
  const { theme, toggleTheme } = useTheme();
  
  // Hydration safety for Zustand persist
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <motion.div 
          initial={{ x: locale === 'ar' ? 20 : -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href={`/${locale}`} className={styles.logo}>
            {storeName}
          </Link>
        </motion.div>
        
        <nav className={styles.nav}>
          <motion.button 
            onClick={toggleTheme} 
            className={styles.iconButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -20, opacity: 0, rotate: 45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: -45 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          
          <Link href={`/${locale}/track`} className={styles.navLink}>
            {t('trackOrder')}
          </Link>

          <Link href={`/${nextLocale}`} className={styles.localeLink}>
            <Globe size={16} />
            <span className={styles.hideOnMobile}>{locale === 'ar' ? 'English' : 'العربية'}</span>
          </Link>

          <Link href={`/${locale}/cart`} className={styles.cartLink}>
            <ShoppingCart size={18} />
            <span className={`${styles.cartText} ${styles.hideOnMobile}`}>{t('cart')}</span>
            <span className={styles.cartCount}>{mounted ? totalItems : 0}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
