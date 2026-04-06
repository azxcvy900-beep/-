'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Heart, Share2, MessageCircle, ShoppingCart, Zap, CheckCircle2, RotateCcw, Trash2, Store } from 'lucide-react';
import BackButton from '@/components/shared/BackButton/BackButton';
import { getProductById, getRelatedProducts, getStoreInfo, Product, StoreInfo } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import ProductCard from '@/components/store/ProductCard/ProductCard';
import styles from './page.module.css';

export default function ProductDetails({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const t = useTranslations('Product');
  const locale = useLocale();
  const { addItem, wishlist, toggleWishlist, clearCart } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const isWishlisted = product ? wishlist.includes(product.id) : false;
  
  useEffect(() => {
    async function fetchData() {
      // Fetching product, store info, and related products
      const [productData, storeData] = await Promise.all([
        getProductById(resolvedParams.id),
        getStoreInfo(resolvedParams.slug)
      ]);

      if (productData) {
        setProduct(productData);
        const related = await getRelatedProducts(productData.category, productData.id, resolvedParams.slug, 4);
        setRelatedProducts(related);
      }
      
      if (storeData) {
        setStore(storeData);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [resolvedParams.id, resolvedParams.slug]);

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
      });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      clearCart();
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
      });
      router.push(`/${locale}/checkout`);
    }
  };

  const getWhatsAppLink = () => {
    if (!product) return '#';
    const message = `مرحباً، أود الاستفسار عن منتج: ${product.name}\nالسعر: ${product.price.toLocaleString()} ${t('currency')}\n${window.location.href}`;
    return `https://wa.me/967770000000?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>جاري التحميل...</div>;
  }

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>المنتج غير موجود.</div>;
  }

  return (
    <div className={styles.container}>
      <BackButton fallbackPath={`/${locale}/store/${resolvedParams.slug}`} />
      
      <div className={styles.wrapper}>
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            <Image 
              src={product.image} 
              alt={product.name} 
              fill 
              className={styles.image}
              priority
            />
            <button 
              className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
            
            <div className={styles.galleryDots}>
              <span className={styles.dotActive}></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.infoHeader}>
            <span className={styles.category}>{product.category}</span>
            <button className={styles.shareBtn} onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('تم نسخ الرابط!'))}>
              <Share2 size={18} />
            </button>
          </div>
          
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.priceRow}>
            <p className={styles.price}>
              {product.price.toLocaleString()} <span>{t('currency')}</span>
            </p>
            <div className={styles.stockBadge}>
              <CheckCircle2 size={14} />
              متوفر في المخزون
            </div>
          </div>
          
          <div className={styles.description}>
            <p>{product.description}</p>
          </div>

          {product.options && product.options.map((option) => (
            <div key={option.name} className={styles.optionGroup}>
              <h3 className={styles.optionTitle}>{option.name}</h3>
              <div className={styles.optionValues}>
                {option.values.map((value) => (
                  <button
                    key={value}
                    className={`${styles.optionBtn} ${selectedOptions[option.name] === value ? styles.activeOption : ''}`}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value }))}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className={styles.quantitySection}>
            <label>{t('quantity') || 'الكمية'}</label>
            <div className={styles.quantity}>
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
               <span>{quantity}</span>
               <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button className={`${styles.addToCart} ${isAdded ? styles.added : ''}`} onClick={handleAddToCart} disabled={isAdded}>
              <ShoppingCart size={20} />
              {isAdded ? 'تمت الإضافة ✓' : t('addToCart')}
            </button>
            <button className={styles.buyNow} onClick={handleBuyNow}>
              <Zap size={20} />
              اشتري الآن
            </button>
          </div>
          
          <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className={styles.whatsappInquiry}>
            <MessageCircle size={20} />
            استفسر عبر الواتساب
          </a>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className={styles.relatedSection}>
          <h2 className={styles.sectionTitle}>منتجات قد تعجبك</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map(p => (
              <ProductCard key={p.id} {...p} slug={resolvedParams.slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
