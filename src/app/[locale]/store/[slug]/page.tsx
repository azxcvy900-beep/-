'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/store/ProductCard/ProductCard';
import CategoryFilter from '@/components/store/CategoryFilter/CategoryFilter';
import SearchBar from '@/components/shared/SearchBar/SearchBar';
import { getStoreProducts, getStoreCategories, getStoreInfo, Product, Category } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { ArrowLeft, Grid, Loader2, Package, ShoppingBag } from 'lucide-react';
import StoreLockedOverlay from '@/components/store/StoreLockedOverlay/StoreLockedOverlay';
import StoreSkeleton from '@/components/store/StoreSkeleton/StoreSkeleton';
import PullToRefresh from '@/components/shared/PullToRefresh/PullToRefresh';
import SearchOverlay from '@/components/store/SearchOverlay/SearchOverlay';
import { Link } from '@/i18n/routing';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const searchParams = useSearchParams();
  
  const previewPrimary = searchParams.get('primaryColor');
  const previewLogo = searchParams.get('logo');
  const isPreviewMode = searchParams.get('preview') === 'true';

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
      window.navigator.vibrate(duration);
    }
  };
  const { setRates, setManualRate, setShippingFee, setStoreSlug } = useCartStore();

  // Each data source loads INDEPENDENTLY
  const { data: products, loading: productsLoading, refetch: refetchProducts } = useStreamingFetch(
    () => getStoreProducts(resolvedParams.slug), [resolvedParams.slug]
  );
  const { data: storeCategories, loading: catsLoading, refetch: refetchCategories } = useStreamingFetch(
    () => getStoreCategories(resolvedParams.slug), [resolvedParams.slug]
  );
  const { data: storeInfo, refetch: refetchInfo } = useStreamingFetch(
    () => getStoreInfo(resolvedParams.slug), [resolvedParams.slug]
  );

  const handleGlobalRefresh = async () => {
    await Promise.all([
      refetchProducts(),
      refetchCategories(),
      refetchInfo()
    ]);
  };

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

  const showLock = storeInfo && resolvedParams.slug !== 'demo' && storeInfo.verificationStatus !== 'active' && storeInfo.verificationStatus !== 'approved';


  const cartItems = useCartStore(state => state.items);

  return (
    <PullToRefresh onRefresh={handleGlobalRefresh}>
      <div className={styles.container}>
        {/* Real-time Style Override for Admin Preview */}
        {isPreviewMode && previewPrimary && (
          <style dangerouslySetInnerHTML={{ __html: `
            :root {
              --primary: ${previewPrimary} !important;
              --primary-rgb: ${previewPrimary.startsWith('#') ? hexToRgbPreview(previewPrimary) : '59, 130, 246'} !important;
            }
            /* Hide scrollbars in preview */
            body::-webkit-scrollbar { display: none; }
            body { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />
        )}

        {showLock && <StoreLockedOverlay storeName={storeInfo?.name} />}
        
        {/* Sleek Brand Header */}

        <header className={`${styles.header} ${styles.stickyHeader}`}>
          <div className={styles.headerContent}>
            {(previewLogo || storeInfo?.logo) && (
              <img src={previewLogo || storeInfo?.logo} alt={storeInfo?.name} className={styles.logo} />
            )}
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>{storeInfo?.name}</h1>
              <p className={styles.subtitle}>{storeInfo?.description}</p>
            </div>
          </div>
          <div className={styles.mobileSearchWrapper}>
             <SearchBar 
               value={searchQuery} 
               onChange={setSearchQuery} 
               placeholder={t('searchPlaceholder')} 
               onFocus={() => setIsSearchOpen(true)}
             />
          </div>
        </header>

        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder={t('searchPlaceholder')} 
        />

        {/* Dynamic Hero Slider - Now at the Top */}
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
                  </div>
                </motion.div>
              ) : (
                <div className={styles.slide}>
                  <img src={storeInfo?.heroBanner || '/assets/demo/banner.png'} alt="Banner" />
                </div>
              )}
            </AnimatePresence>

            {/* Slider Indicators */}
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

        {/* Floating Search Bar Overlap */}
        <div className={styles.searchWrapper}>
           <SearchBar 
             value={searchQuery} 
             onChange={setSearchQuery} 
             placeholder={t('searchPlaceholder')} 
             onFocus={() => setIsSearchOpen(true)}
           />
        </div>

        {/* Premium Welcome Below Search */}
        <div className={styles.welcomeSection}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.welcomeText}
          >
            <h2>{t('welcomeTo')} {storeInfo?.name || 'Store'} 👋</h2>
            <p>{t('startShopping')}</p>
          </motion.div>
        </div>
        {/* Professional Glass Category Bar */}
        <div className={styles.categoryBarWrapper}>
          <div className={styles.sectionHeaderCompact}>
            <h3>{t('categories')}</h3>
          </div>
          <div className={styles.categoryBar}>
            <div 
              className={`${styles.categoryCircle} ${activeCategory === 'all' ? styles.activeCircle : ''}`}
              onClick={() => { setActiveCategory('all'); triggerHaptic('light'); }}
            >
              <div className={styles.circleIcon}>
                <Grid size={28} strokeWidth={2.5} />
              </div>
              <span className={styles.categoryCircleName}>{t('all')}</span>
            </div>

            {(storeCategories || []).map((cat: Category) => (
              <div 
                key={cat.id}
                className={`${styles.categoryCircle} ${activeCategory === cat.name ? styles.activeCircle : ''}`}
                onClick={() => { setActiveCategory(cat.name); triggerHaptic('light'); }}
              >
                <div className={styles.circleIcon}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} />
                  ) : (
                    <Package size={24} />
                  )}
                </div>
                <span className={styles.categoryCircleName}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products Title */}
        <div className={styles.sectionHeader}>
          <h2>{activeCategory === 'all' ? t('featuredProducts') : activeCategory}</h2>
          <div className={styles.headerLine} />
        </div>

        {productsLoading && !products ? (
          <StoreSkeleton />
        ) : (
          <div className={styles.productsSection}>
            <div className={styles.filterInfo}>
              {activeCategory !== 'all' && (
                <span className={styles.activeTag}>
                  عرض قسم: {activeCategory} ({filteredProducts.length} منتج)
                </span>
              )}
            </div>

            <div className={styles.productGrid}>
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
        {/* Floating Cart for Mobile */}
        <AnimatePresence>
          {cartItems.length > 0 && (
            <motion.div 
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 20 }}
              className={styles.floatingCart}
            >
              <Link href={`/store/${resolvedParams.slug}/cart`} onClick={() => triggerHaptic('medium')}>
                <div className={styles.floatingCartContent}>
                  <div className={styles.cartIconWrapper}>
                    <ShoppingBag size={24} />
                    <span className={styles.cartBadgeCount}>{cartItems.length}</span>
                  </div>
                  <span className={styles.cartLabel}>{t('viewCart')}</span>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PullToRefresh>
  );
}

// Helper for preview color conversion
function hexToRgbPreview(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '59, 130, 246';
}
