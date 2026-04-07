'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { getProductById, Product } from '@/lib/api';
import BackButton from '@/components/shared/BackButton/BackButton';
import ProductCard from '@/components/store/ProductCard/ProductCard';
import styles from './wishlist.module.css';

export default function WishlistPage() {
  const t = useTranslations('Header');
  const locale = useLocale();
  const { wishlist, toggleWishlist } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      const productPromises = wishlist.map(id => getProductById(id));
      const results = await Promise.all(productPromises);
      setProducts(results.filter((p): p is Product => p !== null));
      setLoading(false);
    }
    fetchWishlist();
  }, [wishlist]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>...</div>;

  return (
    <div className={styles.container}>
      <BackButton fallbackPath={`/${locale}`} />
      
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.title}
      >
        {t('wishlist')}
      </motion.h1>

      {products.length > 0 ? (
        <div className={styles.grid}>
          <AnimatePresence>
            {products.map((product) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className={styles.cardWrapper}>
                   <ProductCard 
                     {...product} 
                     slug="demo" 
                     currency={product.currency}
                   />
                   <button 
                    className={styles.removeBtn} 
                    onClick={() => toggleWishlist(product.id)}
                    title="Remove"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Heart size={64} color="var(--primary)" style={{ opacity: 0.5 }} />
          <h2>سجل أمنياتك فارغ</h2>
          <p>احفظ المنتجات التي تعجبك هنا لتجدها بسهولة لاحقاً</p>
          <Link href={`/${locale}`} className={styles.shopBtn}>
            تصفح المنتجات
          </Link>
        </div>
      )}
    </div>
  );
}
