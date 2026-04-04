import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import ProductCard from '@/components/store/ProductCard/ProductCard';
import styles from './page.module.css';

const DUMMY_PRODUCTS = [
  {
    id: '1',
    name: 'ساعة آبل الذكية الجيل الثامن',
    price: 150000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1546868889-4e0ca0492cb4?w=800&q=80',
  },
  {
    id: '2',
    name: 'سماعات سوني لاسلكية عازلة للضوضاء',
    price: 120000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  },
  {
    id: '3',
    name: 'كاميرا كانون EOS R6 الاحترافية',
    price: 850000,
    category: 'تصوير',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  },
  {
    id: '4',
    name: 'لابتوب أبل ماك بوك برو M3',
    price: 1200000,
    category: 'حواسيب',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  },
  {
    id: '5',
    name: 'جهاز تحكم بلايستيشن 5 برو',
    price: 45000,
    category: 'ألعاب',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
  },
  {
    id: '6',
    name: 'إضاءة مكتبية ذكية RGB',
    price: 15000,
    category: 'ديكور مكتب',
    image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&q=80',
  },
];

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

export default function StoreHome({ params }: { params: { slug: string } }) {
  const t = useTranslations('StoreHome');

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
      
      <motion.div 
        className={styles.grid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {DUMMY_PRODUCTS.map((product) => (
          <motion.div key={product.id} variants={itemVariants}>
            <ProductCard slug={params.slug} {...product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
