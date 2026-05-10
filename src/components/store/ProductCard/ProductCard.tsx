'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Heart, Star } from 'lucide-react';
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
  viewMode?: 'grid' | 'list';
  onQuickView?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, slug, name, price, originalPrice, image, category, currency = 'YER', viewMode = 'grid' }) => {
  const t = useTranslations('Product');
  const locale = useLocale();
  const router = useRouter();
  const displayCurrency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = React.useState(false);
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const renderedPrice = formatPrice(price, displayCurrency, rates, useManual, manualRate, t('currency'), currency);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('medium');
    addItem({ id, name, price, image, quantity: 1, currency });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('light');
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div 
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/${locale}/store/${slug}/product/${id}`} className={styles.link}>
        <div className={styles.imageWrapper}>
          <img src={image} alt={name} className={styles.image} />
          <button 
            className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
            onClick={toggleWishlist}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>
        
        <div className={styles.info}>
          <span className={styles.categoryName}>{category}</span>
          <h3 className={styles.title}>{name}</h3>
          
          <div className={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
            ))}
          </div>
          
          <div className={styles.priceRow}>
            <span className={styles.price}>{renderedPrice}</span>
          </div>
        </div>
      </Link>
      
      <button 
        className={`${styles.buyBtn} ${isAdded ? styles.buyBtnAdded : ''}`}
        onClick={handleAddToCart}
      >
        {isAdded ? (
          <><Check size={18} /> تمت الإضافة</>
        ) : (
          <>إضافة إلى السلة</>
        )}
      </button>
    </motion.div>
  );
};

export default ProductCard;
