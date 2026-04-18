import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Rocket, Clock, Landmark } from 'lucide-react';
import styles from './StoreLockedOverlay.module.css';

interface StoreLockedOverlayProps {
  storeName?: string;
}

const StoreLockedOverlay: React.FC<StoreLockedOverlayProps> = ({ storeName }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.bgBlur} />
      
      <motion.div 
        className={styles.content}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.iconCircle}>
          <Rocket size={48} className={styles.rocket} />
        </div>
        
        <h1 className={styles.title}>
          <span>{storeName || 'هذا المتجر'}</span> <br />
          قيد التجهيز الآن
        </h1>
        
        <p className={styles.description}>
          نحن نعمل حالياً على استكمال إجراءات التحقق القانونية والفنية لضمان أفضل تجربة تسوق آمنة لك. 
          ترقبوا الانطلاق الحقيقي قريباً جداً!
        </p>

        <div className={styles.benefits}>
          <div className={styles.benefit}>
            <ShieldAlert size={20} />
            <span>تسوق آمن وموثوق</span>
          </div>
          <div className={styles.benefit}>
            <Clock size={20} />
            <span>انطلاق قريب جداً</span>
          </div>
        </div>

        <div className={styles.footer}>
          متصل عبر منصة <span>بايرز / Buyers</span>
        </div>
      </motion.div>
    </div>
  );
};

export default StoreLockedOverlay;
