'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import BackButton from '@/components/shared/BackButton/BackButton';
import styles from './cart.module.css';

export default function CartPage() {
  const t = useTranslations('Cart');
  const pt = useTranslations('Product');
  const locale = useLocale();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const currency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);
  const [mounted, setMounted] = useState(false);

  const formatPriceLocal = (amount: number) => {
    return formatPrice(amount, currency, rates, useManual, manualRate, pt('currency'));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <BackButton />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.count}>{items.length} {t('itemsInCart')}</p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.emptyCart}
        >
          <div className={styles.emptyIcon}>
            <ShoppingBag size={64} />
          </div>
          <h2>{t('emptyCart')}</h2>
          <p>{t('emptyCartDesc')}</p>
          <Link href={`/${locale}`} className={styles.continueShopping}>
            {t('continueShopping')}
          </Link>
        </motion.div>
      ) : (
        <div className={styles.content}>
          <div className={styles.itemsList}>
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={styles.cartItem}
                >
                  <div className={styles.itemImage}>
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    <p className={styles.itemPrice}>
                      {formatPriceLocal(item.price)}
                    </p>
                  </div>

                  <div className={styles.quantityControls}>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={styles.qtyBtn}
                    >
                      <Minus size={16} />
                    </button>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={styles.qtyBtn}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className={styles.itemTotal}>
                    {formatPriceLocal(item.price * item.quantity)}
                  </div>

                  <button 
                    onClick={() => removeItem(item.id)}
                    className={styles.removeBtn}
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.summary}
          >
            <h3>{t('orderSummary')}</h3>
            <div className={styles.summaryRow}>
              <span>{t('subtotal')}</span>
              <span>{formatPriceLocal(getTotalPrice())}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('shipping')}</span>
              <span className={styles.free}>{t('free')}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>{t('total')}</span>
              <span>{formatPriceLocal(getTotalPrice())}</span>
            </div>
            
            <Link href={`/${locale}/checkout`} className={styles.checkoutBtn}>
              {t('checkout')}
              <ArrowRight size={20} />
            </Link>

            <Link href={`/${locale}`} className={styles.backLink}>
              {t('continueShopping')}
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
