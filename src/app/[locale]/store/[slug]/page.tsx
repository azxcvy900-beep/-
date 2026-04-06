'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/store/ProductCard/ProductCard';
import CategoryFilter from '@/components/store/CategoryFilter/CategoryFilter';
import { getStoreProducts, Product } from '@/lib/api';
import styles from './page.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function StoreHome({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const t = useTranslations('StoreHome');
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const data = await getStoreProducts(resolvedParams.slug);
      setProducts(data);
      setLoading(false);
    }
    loadProducts();
  }, [resolvedParams.slug]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return uniqueCategories;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className={styles.container}>
      <motion.header 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </motion.header>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ 
              width: 40, 
              height: 40, 
              border: '3px solid var(--primary)', 
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 1rem'
            }}
          />
          {t('loading')}
        </div>
      ) : (
        <>
          <CategoryFilter 
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            allLabel={t('allCategories')}
          />

          <motion.div 
            className={styles.grid}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div 
                  key={product.id} 
                  variants={itemVariants}
                  layout
                >
                  <ProductCard slug={resolvedParams.slug} {...product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {filteredProducts.length === 0 && (
            <div className={styles.emptyState}>
              <p>{t('noProducts')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
