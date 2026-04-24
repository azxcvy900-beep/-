'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import styles from './FloatingCTA.module.css';

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={styles.wrapper}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <Link href={`/${locale}/admin/login`} className={styles.cta}>
            <div className={styles.icon}>
              <Rocket size={20} />
            </div>
            <span className={styles.text}>ابدأ متجرك الآن مجاناً</span>
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
