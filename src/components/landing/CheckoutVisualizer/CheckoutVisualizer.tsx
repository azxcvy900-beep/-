'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CreditCard, BellRing, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from './CheckoutVisualizer.module.css';

export default function CheckoutVisualizer() {
  // Using English as fallback if translations aren't available for these new keys yet
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3500); // 3.5 seconds per step
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { icon: <ShoppingCart size={20} />, text: 'إضافة للسلة' },
    { icon: <CreditCard size={20} />, text: 'دفع بنقرة واحدة' },
    { icon: <BellRing size={20} />, text: 'إشعار فوري للتاجر' },
  ];

  return (
    <section className={styles.container}>
      <div className={styles.textContent}>
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={styles.preTitle}
        >
          تجربة شراء سلسة
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          أسرع عملية دفع، لزيادة مبيعاتك
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          لا تفقد أي عميل بسبب تعقيد الدفع. منصتنا توفر أسرع عملية Checkout لضمان أعلى معدل تحويل لمبيعاتك. يدعم الدفع بلمسة واحدة!
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className={styles.steps}
        >
          {steps.map((step, idx) => (
            <div key={idx} className={`${styles.step} ${activeStep === idx ? styles.active : ''}`}>
              <div className={styles.stepIcon}>{idx + 1}</div>
              <span>{step.text}</span>
              {activeStep === idx && (
                <motion.div layoutId="activeIndicator" style={{ marginRight: 'auto' }}>
                  {step.icon}
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={styles.visualContent}
      >
        <div className={styles.phoneMockup}>
          <div className={styles.notch}></div>
          <div className={styles.screen}>
            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div className={styles.mockImage}></div>
                  <div className={styles.mockTitle}></div>
                  <div className={styles.mockPrice}></div>
                  <motion.button 
                    animate={{ scale: [1, 1.05, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={styles.mockBtn}
                  >
                    <ShoppingCart size={18} /> أضف للسلة
                  </motion.button>
                </motion.div>
              )}
              {activeStep === 1 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', textAlign: 'center' }}
                >
                  <div className={styles.successCircle}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className={styles.successTitle}>تم الدفع بنجاح!</h3>
                  <p className={styles.successDesc}>سيتم توصيل طلبك قريباً</p>
                </motion.div>
              )}
              {activeStep === 2 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}
                >
                   <div className={styles.mockHeader}>
                     <div className={styles.mockAvatar}></div>
                     <div className={styles.mockHeaderTitle}></div>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <div className={styles.mockOrderItem}></div>
                     <div className={styles.mockOrderItem}></div>
                     <div className={styles.mockOrderItem}></div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {activeStep === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className={styles.dashboardNotification}
            >
              <div className={styles.notifIcon}>
                <BellRing size={24} />
              </div>
              <div>
                <div className={styles.notifTitle}>طلب جديد #1024</div>
                <div className={styles.notifDesc}>تم الدفع مسبقاً بقيمة 1250 ر.س</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
