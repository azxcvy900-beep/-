'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Heart, ShoppingCart } from 'lucide-react';
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
}

const ProductCard: React.FC<ProductCardProps> = ({ id, slug, name, price, originalPrice, image, category, currency = 'YER' }) => {
  const t = useTranslations('Product');
  const locale = useLocale();
  const displayCurrency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = React.useState(false);

  const renderedPrice = formatPrice(price, displayCurrency, rates, false, 0, t('currency'), currency);

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
      whileHover={{ y: -4 }}
    >
      <Link href={`/${locale}/store/${slug}/product/${id}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <img src={image} alt={name} className={styles.image} />
          <div className={styles.overlay}>
             <button className={styles.wishlistBtn} onClick={(e) => { e.preventDefault(); triggerHaptic('light'); }}>
               <Heart size={18} />
             </button>
          </div>
        </div>
      </Link>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.category}>{category}</span>
        </div>
        <Link href={`/${locale}/store/${slug}/product/${id}`}>
          <h3 className={styles.title}>{name}</h3>
        </Link>
        
        <div className={styles.footer}>
          <div className={styles.priceInfo}>
            <span className={styles.price}>{renderedPrice}</span>
            {originalPrice && <span className={styles.oldPrice}>{originalPrice}</span>}
          </div>
          
          <button 
            className={`${styles.addBtn} ${isAdded ? styles.added : ''}`}
            onClick={handleAddToCart}
          >
            {isAdded ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
