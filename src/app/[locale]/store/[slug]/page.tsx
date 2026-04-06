'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/store/ProductCard/ProductCard';
import CategoryFilter from '@/components/store/CategoryFilter/CategoryFilter';
import SearchBar from '@/components/shared/SearchBar/SearchBar';
import { getStoreProducts, getStoreCategories, Product, Category } from '@/lib/api';
import { ArrowLeft, Grid } from 'lucide-react';
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
  const [storeCategories, setStoreCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'categories' | 'products'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, catsData] = await Promise.all([
          getStoreProducts(resolvedParams.slug),
          getStoreCategories(resolvedParams.slug)
        ]);
        setProducts(productsData);
        setStoreCategories(catsData);
      } catch (error) {
        console.error("Error loading store data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.slug]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    setViewMode('products');
  };

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
            style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }}
          />
          {t('loading')}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'categories' ? (
            <motion.div 
              key="categories-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={styles.categoriesSection}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>تسوق حسب القسم</h2>
                <div className={styles.searchCompact}>
                   <SearchBar value={searchQuery} onChange={(v) => { setSearchQuery(v); setViewMode('products'); }} placeholder="ابحث عن منتج..." />
                </div>
              </div>
              
              <div className={styles.categoryGrid}>
                {storeCategories.length > 0 ? (
                  storeCategories.map((cat) => (
                    <motion.div 
                      key={cat.id}
                      className={styles.categoryCard}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCategoryClick(cat.name)}
                    >
                      <div className={styles.categoryIconLarge}>
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} />
                        ) : (
                          <Grid size={40} color="var(--primary)" />
                        )}
                      </div>
                      <h3 className={styles.categoryCardName}>{cat.name}</h3>
                      <span className={styles.itemCount}>
                        {products.filter(p => p.category === cat.name).length} منتج
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                    لم يتم إضافة أقسام مخصصة بعد. يتم عرض كافة المنتجات.
                    <button onClick={() => setViewMode('products')} className={styles.showAllBtn}>عرض كل المنتجات</button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="products-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.productsHeader}>
                <button 
                  onClick={() => { setViewMode('categories'); setActiveCategory('all'); }} 
                  className={styles.backBtn}
                >
                  <ArrowLeft size={18} />
                  <span>العودة للأقسام</span>
                </button>
                <div style={{ flex: 1, maxWidth: '400px' }}>
                  <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('searchPlaceholder')} />
                </div>
              </div>

              <div className={styles.filterInfo}>
                {activeCategory !== 'all' && <span className={styles.activeTag}>القسم: {activeCategory}</span>}
              </div>

              <motion.div 
                className={styles.grid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredProducts.map((product) => (
                  <motion.div key={product.id} variants={itemVariants} layout>
                    <ProductCard slug={resolvedParams.slug} {...product} />
                  </motion.div>
                ))}
              </motion.div>
              
              {filteredProducts.length === 0 && (
                <div className={styles.emptyState}>
                  <p>{t('noProducts')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
