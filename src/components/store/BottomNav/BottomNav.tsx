'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BottomNav.module.css';

const BottomNav = ({ storeSlug }: { storeSlug: string }) => {
  const locale = useLocale();
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const navItems = [
    { icon: Home, label: 'الرئيسية', href: `/${locale}/store/${storeSlug}` },
    { icon: Heart, label: 'المفضلة', href: `/${locale}/store/${storeSlug}/favorites` },
    { icon: Search, label: 'البحث', href: `/${locale}/store/${storeSlug}/search` },
    { icon: ShoppingBag, label: 'السلة', href: `/${locale}/cart`, badge: totalItems },
    { icon: User, label: 'الحساب', href: `/${locale}/store/${storeSlug}/account` },
  ];

  // Hide BottomNav on product details page
  const isProductPage = pathname.includes('/product/');
  if (isProductPage) return null;

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
            <div className={styles.iconWrapper}>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#fbbf24" : "#64748b"} />
              <AnimatePresence>
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={styles.badge}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
