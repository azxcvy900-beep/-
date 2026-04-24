'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { getPlatformSettings } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';
import styles from './WhatsAppSupport.module.css';

const WhatsAppSupport = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState('967770000000');
  const locale = useLocale();

  React.useEffect(() => {
    async function loadSettings() {
      const settings = await getPlatformSettings();
      if (settings?.supportPhone) {
        setPhoneNumber(settings.supportPhone);
      }
    }
    loadSettings();
  }, []);

  const message = locale === 'ar' ? 'مرحباً، لدي استفسار بخصوص المنصة...' : 'Hello, I have an inquiry about the platform...';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={styles.tooltip}
          >
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={12} />
            </button>
            <p>{locale === 'ar' ? 'تحتاج مساعدة؟ تواصل معنا' : 'Need help? Chat with us'}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.floatBtn}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => triggerHaptic('light')}
      >
        <MessageCircle size={32} />
        <motion.span 
          className={styles.pulse}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.a>
    </div>
  );
};

export default WhatsAppSupport;
