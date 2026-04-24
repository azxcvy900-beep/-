import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, History, TrendingUp } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';
import styles from './SearchOverlay.module.css';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, value, onChange, placeholder }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const trends = ['عروض الصيف', 'إلكترونيات', 'ملابس نسائية', 'عطور'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={onClose}>
              <ArrowRight size={24} />
            </button>
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                className={styles.input}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
              />
              {value && (
                <button 
                  className={styles.clearBtn} 
                  onClick={() => {
                    onChange('');
                    triggerHaptic('light');
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.content}>
            {!value ? (
              <div className={styles.suggestions}>
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>
                    <History size={16} /> عمليات البحث الأخيرة
                  </h4>
                  <div className={styles.tagCloud}>
                    <span className={styles.empty}>لا توجد عمليات بحث سابقة</span>
                  </div>
                </div>

                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>
                    <TrendingUp size={16} /> الأكثر بحثاً الآن
                  </h4>
                  <div className={styles.tagCloud}>
                    {trends.map(trend => (
                      <button 
                        key={trend} 
                        className={styles.trendTag}
                        onClick={() => {
                          onChange(trend);
                          triggerHaptic('light');
                        }}
                      >
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.resultsInfo}>
                جاري البحث عن "{value}"...
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
