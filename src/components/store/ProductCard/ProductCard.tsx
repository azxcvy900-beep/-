import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice, triggerHaptic } from '@/lib/utils';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  currency?: 'YER' | 'SAR' | 'USD';
}

const ProductCard: React.FC<ProductCardProps> = ({ id, slug, name, price, originalPrice, image, category, currency = 'YER' }) => {
  const t = useTranslations('Product');
  const locale = useLocale();
  const displayCurrency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = React.useState(false);

  const renderedPrice = formatPrice(price, displayCurrency, rates, useManual, manualRate, t('currency'), currency);
  const renderedOriginalPrice = originalPrice 
    ? formatPrice(originalPrice, displayCurrency, rates, useManual, manualRate, t('currency'), currency) 
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('light');
    addItem({ id, name, price, image, quantity: 1, currency });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div 
      className={styles.card}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link href={`/${locale}/store/${slug}/product/${id}`} className={styles.productLink} onClick={() => triggerHaptic('light')}>
        <div className={styles.imageWrapper}>
          <Image 
            src={image} 
            alt={name} 
            fill 
            className={styles.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className={styles.badges}>
            <span className={styles.categoryBadge}>{category}</span>
            {originalPrice && originalPrice > price && (
              <span className={styles.saleBadge}>SALE</span>
            )}
          </div>
        </div>
        
        <div className={styles.info}>
          <h3 className={styles.title}>{name}</h3>
          {originalPrice && originalPrice > price && (
            <div className={styles.discountInfo}>
              <span className={styles.originalPrice}>
                {renderedOriginalPrice}
              </span>
              <span className={styles.discountPercent}>
                -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
              </span>
            </div>
          )}
        </div>
      </Link>
      
      <div className={styles.contentFooter}>
        <div className={styles.footer}>
          <div className={styles.priceContainer}>
            <span className={styles.price}>
              {renderedPrice}
            </span>
          </div>
          <motion.button 
            className={`${styles.addButton} ${isAdded ? styles.addedButton : ''}`}
            onClick={handleAddToCart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isAdded ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={16} />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} />
                  <span className={styles.hideTextMobile}>{t('addToCart')}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
