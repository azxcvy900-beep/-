'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Wrench, Clock, ShieldAlert } from 'lucide-react';
import styles from './MaintenancePage.module.css';

export default function MaintenancePage() {
  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <div className={styles.bgGrid} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.card}
      >
        <div className={styles.iconWrapper}>
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className={styles.mainIcon}
          >
            <Settings size={60} strokeWidth={1.5} />
          </motion.div>
          <div className={styles.secondaryIcon}>
            <Wrench size={24} />
          </div>
        </div>

        <h1 className={styles.title}>المنصة تحت الصيانة</h1>
        <p className={styles.description}>
          نحن نقوم حالياً بإجراء بعض التحسينات لضمان أفضل تجربة تسوق لك. 
          سنعود للعمل خلال وقت قصير جداً. شكراً لصبرك!
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Clock size={20} />
            <span>نعود قريباً</span>
          </div>
          <div className={styles.infoItem}>
            <ShieldAlert size={20} />
            <span>تحديثات أمنية</span>
          </div>
        </div>

        <div className={styles.footer}>
          بايرز &copy; {new Date().getFullYear()} - منصة التجارة المتكاملة
        </div>
      </motion.div>
    </div>
  );
}
