'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/store/ProductCard/ProductCard';
import CategoryFilter from '@/components/store/CategoryFilter/CategoryFilter';
import SearchBar from '@/components/shared/SearchBar/SearchBar';
import { getStoreProducts, getStoreCategories, getStoreInfo, Product, Category } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { ArrowLeft, Grid, Loader2 } from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'categories' | 'products'>('categories');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart Sync Actions
  const { setRates, setManualRate, setShippingFee } = useCartStore();

  // Each data source loads INDEPENDENTLY
  const { data: products, loading: productsLoading } = useStreamingFetch(
    () => getStoreProducts(resolvedParams.slug), [resolvedParams.slug]
  );
  const { data: storeCategories, loading: catsLoading } = useStreamingFetch(
    () => getStoreCategories(resolvedParams.slug), [resolvedParams.slug]
  );
  const { data: storeInfo } = useStreamingFetch(
    () => getStoreInfo(resolvedParams.slug), [resolvedParams.slug]
  );

  // Sync store settings when info arrives
  useEffect(() => {
    if (storeInfo) {
      setStoreSlug(resolvedParams.slug);
      if (storeInfo.currencySettings?.rates) setRates(storeInfo.currencySettings.rates);
      if (storeInfo.currencySettings?.manualSARRate !== undefined) {
        setManualRate(!!storeInfo.currencySettings.useManualSARRate, storeInfo.currencySettings.manualSARRate);
      }
      if (storeInfo.shippingFee !== undefined) setShippingFee(storeInfo.shippingFee);
    }
  }, [storeInfo, setRates, setManualRate, setShippingFee]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p: Product) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Progressive rendering for products
  const { visibleItems: visibleProducts, isStreaming } = useProgressiveLoad(filteredProducts, 4, 150);
  const { visibleItems: visibleCategories } = useProgressiveLoad(storeCategories || [], 3, 200);

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
      
      {productsLoading && !products ? (
        <div style={{ textAlign: 'center', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#64748b' }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
          {t('loading')}
          <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
                {catsLoading ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> جاري تحميل الأقسام...
                  </div>
                ) : visibleCategories.length > 0 ? (
                  visibleCategories.map((cat: Category) => (
                    <motion.div 
                      key={cat.id}
                      className={styles.categoryCard}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCategoryClick(cat.name)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
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
                        {(products || []).filter((p: Product) => p.category === cat.name).length} منتج
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


              {/* Products rendered progressively */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {visibleProducts.map((p: Product) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ProductCard 
                      id={p.id}
                      slug={resolvedParams.slug}
                      name={p.name}
                      price={p.price}
                      originalPrice={p.originalPrice}
                      image={p.image}
                      category={p.category}
                      currency={p.currency}
                    />
                  </motion.div>
                ))}
              </div>

              {isStreaming && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  جاري تحميل المزيد...
                </div>
              )}

              {!productsLoading && filteredProducts.length === 0 && (
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
