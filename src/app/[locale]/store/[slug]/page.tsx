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
  const { setRates, setManualRate, setShippingFee, setStoreSlug } = useCartStore();

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
      
      {/* Search Bar - Permanent */}
      <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
         <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('searchPlaceholder')} />
      </div>

      {/* Modern Circle Category Bar */}
      <div className={styles.categoryBarWrapper}>
        <div className={styles.categoryBar}>
           {/* 'All' Category */}
           <div 
             className={`${styles.categoryCircle} ${activeCategory === 'all' ? styles.activeCircle : ''}`}
             onClick={() => setActiveCategory('all')}
           >
             <div className={styles.circleIcon}>
                <Grid size={32} color={activeCategory === 'all' ? 'var(--primary)' : '#94a3b8'} />
             </div>
             <span className={styles.categoryCircleName}>الكل</span>
           </div>

           {/* Dynamic Categories */}
           {(storeCategories || []).map((cat: Category) => (
             <div 
               key={cat.id}
               className={`${styles.categoryCircle} ${activeCategory === cat.name ? styles.activeCircle : ''}`}
               onClick={() => setActiveCategory(cat.name)}
             >
               <div className={styles.circleIcon}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} />
                  ) : (
                    <Package size={28} color="#94a3b8" />
                  )}
               </div>
               <span className={styles.categoryCircleName}>{cat.name}</span>
             </div>
           ))}
        </div>
      </div>

      {productsLoading && !products ? (
        <div style={{ textAlign: 'center', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#64748b' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          {t('loading')}
          <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className={styles.productsSection}>
          <div className={styles.filterInfo}>
            {activeCategory !== 'all' && (
              <span className={styles.activeTag}>
                عرض قسم: {activeCategory} ({filteredProducts.length} منتج)
              </span>
            )}
          </div>

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
        </div>
      )}
    </div>
  );
}
