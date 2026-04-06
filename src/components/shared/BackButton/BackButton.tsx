'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './BackButton.module.css';

interface BackButtonProps {
  fallbackPath?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ fallbackPath }) => {
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else if (fallbackPath) {
      router.push(fallbackPath);
    } else {
      router.push(`/${locale}`);
    }
  };

  return (
    <motion.button
      onClick={handleBack}
      className={styles.backBtn}
      whileHover={{ x: isRTL ? 5 : -5 }}
      whileTap={{ scale: 0.95 }}
    >
      {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
      <span>{isRTL ? 'العودة' : 'Back'}</span>
    </motion.button>
  );
};

export default BackButton;
