import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, slug, name, price, image, category }) => {
  const t = useTranslations('Product');
  const locale = useLocale();
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name, price, image });
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
          <span className={styles.categoryBadge}>{category}</span>
        </div>
        
        <div className={styles.info}>
          <h3 className={styles.title}>{name}</h3>
        </div>
      </Link>
      
      <div className={styles.contentFooter}>
        <div className={styles.footer}>
          <span className={styles.price}>
            {price.toLocaleString()} <span className={styles.currency}>{t('currency')}</span>
          </span>
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
