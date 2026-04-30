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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}
                >
                  <img src="/assets/demo/airpods.png" className={styles.productImage} alt="AirPods Pro" />
                  <h3 className={styles.productTitle}>Apple AirPods Pro 2</h3>
                  <div className={styles.productRating}>
                    {"★★★★★".split('').map((star, i) => <span key={i}>{star}</span>)} <span style={{ color: '#64748b', marginLeft: '0.25rem' }}>(128)</span>
                  </div>
                  <div className={styles.productPrice}>850 ر.س</div>
                  
                  <motion.button 
                    animate={{ scale: [1, 1.03, 1] }} 
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(0,0,0,0.6)', position: 'relative' }}
                >
                  {/* Background product blurred */}
                  <div style={{ padding: '1rem', opacity: 0.5, filter: 'blur(5px)', background: 'white', height: '100%' }}>
                    <img src="/assets/demo/airpods.png" className={styles.productImage} alt="AirPods Pro" />
                  </div>
                  
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    className={styles.checkoutDrawer}
                  >
                    <div className={styles.drawerHandle}></div>
                    
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                    >
                      <div className={styles.successCircle}>
                        <CheckCircle2 size={36} />
                      </div>
                      <h3 className={styles.successTitle}>تم الدفع بنجاح!</h3>
                      <p className={styles.successDesc}>بواسطة Apple Pay</p>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
              {activeStep === 2 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={styles.merchantScreen}
                >
                   <div className={styles.merchantHeader}>
                     <div style={{ fontWeight: 'bold' }}>لوحة التحكم</div>
                     <div className={styles.merchantAvatar}>M</div>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <motion.div 
                       initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                       animate={{ height: 'auto', opacity: 1, marginBottom: '1rem' }}
                       transition={{ duration: 0.5, type: 'spring' }}
                       className={`${styles.orderCard} ${styles.newOrder}`}
                     >
                       <div className={styles.orderInfo}>
                         <h4>طلب #1024</h4>
                         <p>Apple AirPods Pro 2</p>
                       </div>
                       <div className={styles.orderPrice}>850 ر.س</div>
                     </motion.div>
                     <div className={styles.orderCard}>
                       <div className={styles.orderInfo}>
                         <h4>طلب #1023</h4>
                         <p>كفر حماية آيفون</p>
                       </div>
                       <div className={styles.orderPrice} style={{ color: 'white' }}>25 ر.س</div>
                     </div>
                     <div className={styles.orderCard}>
                       <div className={styles.orderInfo}>
                         <h4>طلب #1022</h4>
                         <p>شاحن أنكر 65W</p>
                       </div>
                       <div className={styles.orderPrice} style={{ color: 'white' }}>140 ر.س</div>
                     </div>
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
