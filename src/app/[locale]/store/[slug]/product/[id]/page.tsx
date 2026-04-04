import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './page.module.css';

// Reuse dummy data or a finder function
const getProduct = (id: string) => {
  const products = [
    {
      id: '1',
      name: 'ساعة آبل الذكية الجيل الثامن',
      price: 150000,
      description: 'تتميز ساعة Apple Watch Series 8 بمستشعرات وتطبيقات صحية متطورة، تتيح لك إجراء مخطط كهربائية القلب، وقياس معدل نبضات القلب، والأكسجين في الدم، وتتبع التغيرات في درجة الحرارة للحصول على رؤى متقدمة حول الدورة الشهرية.',
      category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1546868889-4e0ca0492cb4?w=1200&q=80',
    },
  ];
  return products.find(p => p.id === id) || products[0];
};

export default function ProductDetails({ params }: { params: { slug: string, id: string } }) {
  const product = getProduct(params.id);
  const t = useTranslations('Product');
  const locale = useLocale();
  
  return (
    <div className={styles.container}>
      <Link href={`/${locale}/store/${params.slug}`} className={styles.backButton}>
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
               <button>-</button>
               <span>1</span>
               <button>+</button>
            </div>
            <button className={styles.addToCart}>
              {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
