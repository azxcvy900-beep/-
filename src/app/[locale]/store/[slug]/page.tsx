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
import { ArrowLeft, Grid, Loader2, Package } from 'lucide-react';
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
  const [currentSlide, setCurrentSlide] = useState(0);

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
  }, [storeInfo]);

  // Auto-slide logic for Hero Banner
  useEffect(() => {
    if (!storeInfo?.heroBanners || storeInfo.heroBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % storeInfo.heroBanners!.length);
    }, 3000); 
    
    return () => clearInterval(interval);
  }, [storeInfo?.heroBanners]);

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

  return (
    <div className={styles.container}>
      {/* Sleek Brand Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {storeInfo?.logo && (
            <img src={storeInfo.logo} alt={storeInfo.name} className={styles.logo} />
          )}
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{storeInfo?.name}</h1>
            <p className={styles.subtitle}>{storeInfo?.description}</p>
          </div>
        </div>
      </header>

      {/* Dynamic Hero Slider */}
      <section className={styles.heroSection}>
        <div className={styles.heroBanner}>
          <AnimatePresence mode="wait">
            {storeInfo?.heroBanners && storeInfo.heroBanners.length > 0 ? (
              <motion.div 
                key={currentSlide}
                className={styles.slide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1.0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
              >
                <img 
                  src={storeInfo.heroBanners[currentSlide].image} 
                  alt={storeInfo.heroBanners[currentSlide].title} 
                />
                <div className={styles.bannerOverlay}>
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={styles.bannerBadge}
                  >
                    عروض حصرية
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {storeInfo.heroBanners[currentSlide].title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {storeInfo.heroBanners[currentSlide].subtitle}
                  </motion.p>
                </div>
              </motion.div>
            ) : (
              <div className={styles.slide}>
                <img src={storeInfo?.heroBanner || '/assets/demo/banner.png'} alt="Banner" />
              </div>
            )}
          </AnimatePresence>

          {/* Slider Indicators (Dots) */}
          {storeInfo?.heroBanners && storeInfo.heroBanners.length > 1 && (
            <div className={styles.sliderControls}>
              {storeInfo.heroBanners.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.dot} ${currentSlide === idx ? styles.activeDot : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className={styles.searchWrapper}>
         <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('searchPlaceholder')} />
      </div>

      {/* Professional Glass Category Bar */}
      <div className={styles.categoryBarWrapper}>
        <div className={styles.categoryBar}>
          <div 
            className={`${styles.categoryCircle} ${activeCategory === 'all' ? styles.activeCircle : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <div className={styles.circleIcon}>
              <Grid size={40} strokeWidth={2.5} />
            </div>
            <span className={styles.categoryCircleName}>الكل</span>
          </div>

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
                  <Package size={28} />
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
