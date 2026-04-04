'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getProductById, Product } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import styles from './page.module.css';

export default function ProductDetails({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const resolvedParams = React.use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const t = useTranslations('Product');
  const locale = useLocale();
  const addItem = useCartStore((state) => state.addItem);
  
  useEffect(() => {
    async function fetchProduct() {
      const data = await getProductById(resolvedParams.id);
      setProduct(data);
      setLoading(false);
    }
    fetchProduct();
  }, [resolvedParams.id]);

  const handleAddToCart = () => {
    if (product) {
      // Add the item N times or just use our store. Wait, our store addItem adds 1. 
      // Let's adapt addItem to accept quantity or we just loop.
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image
        });
      }
      alert('تم إضافة المنتج بنجاح');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>جاري التحميل...</div>;
  }

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>المنتج غير موجود.</div>;
  }

  return (
    <div className={styles.container}>
      <Link href={`/${locale}/store/${resolvedParams.slug}`} className={styles.backButton}>
        {t('back')}
      </Link>
      
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
          </div>
        </div>
        
        <div className={styles.infoSection}>
          <span className={styles.category}>{product.category}</span>
          <h1 className={styles.title}>{product.name}</h1>
          <p className={styles.price}>
            {product.price.toLocaleString()} <span>{t('currency')}</span>
          </p>
          
          <div className={styles.description}>
            <h3>{t('description')}</h3>
            <p>{product.description}</p>
          </div>
          
          <div className={styles.actions}>
            <div className={styles.quantity}>
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
               <span>{quantity}</span>
               <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className={styles.addToCart} onClick={handleAddToCart}>
              {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
