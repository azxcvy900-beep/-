import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, slug, name, price, originalPrice, image, category }) => {
  const t = useTranslations('Product');
  const locale = useLocale();
  const currency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);
  const { addItem } = useCartStore();

  const renderedPrice = formatPrice(price, currency, rates, useManual, manualRate, t('currency'));
  const renderedOriginalPrice = originalPrice ? formatPrice(originalPrice, currency, rates, useManual, manualRate, t('currency')) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name, price, image, quantity: 1 });
  };

  return (
    <motion.div 
      className={styles.card}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link href={`/${locale}/store/${slug}/product/${id}`} className={styles.productLink}>
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
            className={styles.addButton}
            onClick={handleAddToCart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={16} />
            <span className={styles.hideTextMobile}>{t('addToCart')}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
