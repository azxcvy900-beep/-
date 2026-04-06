'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Heart, Share2, MessageCircle, ShoppingCart, Zap, CheckCircle2, RotateCcw, Trash2, Store, Star, User } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import BackButton from '@/components/shared/BackButton/BackButton';
import { getProductById, getRelatedProducts, getStoreInfo, getProductReviews, addReview, Product, StoreInfo, Review } from '@/lib/api';
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
  const currency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);
  const [isAdded, setIsAdded] = useState(false);

  const renderedPrice = product ? formatPrice(product.price, currency, rates, useManual, manualRate, t('currency')) : '';
  const renderedOriginalPrice = product?.originalPrice ? formatPrice(product.originalPrice, currency, rates, useManual, manualRate, t('currency')) : null;
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState({ rating: 5, comment: '', name: '' });
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const isWishlisted = product ? wishlist.includes(product.id) : false;

  useEffect(() => {
    async function fetchData() {
      // Fetching product, store info, and related products
      const [productData, storeData, reviewsData] = await Promise.all([
        getProductById(resolvedParams.id),
        getStoreInfo(resolvedParams.slug),
        getProductReviews(resolvedParams.slug, resolvedParams.id)
      ]);

      if (productData) {
        setProduct(productData);
        const related = await getRelatedProducts(productData.category, productData.id, resolvedParams.slug, 4);
        setRelatedProducts(related);
      }
      
      if (storeData) {
        setStore(storeData);
      }

      if (reviewsData) {
        setReviews(reviewsData);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [resolvedParams.id, resolvedParams.slug]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !userReview.comment || !userReview.name) return;
    setIsReviewing(true);
    try {
      await addReview({
        productId: product.id,
        storeSlug: resolvedParams.slug,
        customerName: userReview.name,
        rating: userReview.rating,
        comment: userReview.comment
      });
      setReviewSubmitted(true);
      setUserReview({ rating: 5, comment: '', name: '' });
      setTimeout(() => setReviewSubmitted(false), 5000);
    } catch (error) {
      alert("حدث خطأ أثناء إرسال التقييم.");
    } finally {
      setIsReviewing(false);
    }
  };

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
    const message = `مرحباً، أود الاستفسار عن منتج: ${product.name}\nالسعر: ${formatPrice(product.price, currency, rates, useManual, manualRate, t('currency'))}\n${window.location.href}`;
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
          <div className={styles.priceSection}>
            <span className={styles.currentPrice}>{renderedPrice}</span>
            {renderedOriginalPrice && (
              <span className={styles.oldPrice}>{renderedOriginalPrice}</span>
            )}
          </div>
          
          <div className={styles.description}>
            <p>{product.description}</p>
          </div>

          {/* معلومات البائع - مستوحى من المواقع العالمية */}
          <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
            <div style={{ background: 'white', padding: '4px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {store?.logo ? (
                <img src={store.logo} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Store size={24} color="#3b82f6" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>البائع:</p>
              <h4 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{store?.name || 'متجر معتمد'}</h4>
            </div>
            <Link 
              href={`/${locale}/store/${resolvedParams.slug}`}
              style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', border: '1px solid #3b82f6' }}
            >
              زيارة المتجر
            </Link>
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

      <div className={styles.reviewsSection}>
        <h2 className={styles.sectionTitle}>تقييمات العملاء</h2>
        
        <div className={styles.reviewsGrid}>
          {/* Review Stats Summary */}
          <div className={styles.reviewsSummary}>
            <div className={styles.averageRating}>
              <span className={styles.ratingNum}>
                {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                  : '5.0'}
              </span>
              <div className={styles.stars}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={20} fill={s <= (reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 5) ? "#fbbf24" : "none"} color="#fbbf24" />
                ))}
              </div>
              <p className={styles.reviewCount}>بناءً على {reviews.length} تقييم</p>
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>أضف تقييمك</h3>
              {reviewSubmitted ? (
                <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <CheckCircle2 size={24} style={{ marginBottom: '8px' }} />
                  <p>شكراً لتقييمك! سيظهر بعد مراجعة الإدارة.</p>
                </div>
              ) : (
                <>
                  <div className={styles.starInput}>
                    {[1,2,3,4,5].map(s => (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => setUserReview({...userReview, rating: s})}
                      >
                        <Star size={24} fill={s <= userReview.rating ? "#fbbf24" : "none"} color="#fbbf24" />
                      </button>
                    ))}
                  </div>
                  <input 
                    className={styles.input}
                    placeholder="اسمك"
                    value={userReview.name}
                    onChange={(e) => setUserReview({...userReview, name: e.target.value})}
                    required
                  />
                  <textarea 
                    className={styles.textarea}
                    placeholder="رأيك في المنتج..."
                    value={userReview.comment}
                    onChange={(e) => setUserReview({...userReview, comment: e.target.value})}
                    required
                  />
                  <button type="submit" className={styles.submitReview} disabled={isReviewing}>
                    {isReviewing ? 'جاري الإرسال...' : 'إرسال التقييم'}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Reviews List */}
          <div className={styles.reviewsList}>
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.userIcon}><User size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <h4 className={styles.userName}>{review.customerName}</h4>
                      <div className={styles.reviewStars}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} fill={s <= review.rating ? "#fbbf24" : "none"} color="#fbbf24" />
                        ))}
                      </div>
                    </div>
                    <span className={styles.reviewDate}>{new Date(review.date).toLocaleDateString(locale)}</span>
                  </div>
                  <p className={styles.reviewText}>{review.comment}</p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                لا توجد تقييمات لهذا المنتج بعد. كن أول من يقيّم!
              </div>
            )}
          </div>
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
