'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet/BottomSheet';
import { useCartStore } from '@/lib/store';
import { formatPrice, triggerHaptic } from '@/lib/utils';
import { Product } from '@/lib/api';
import styles from './ProductQuickView.module.css';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  currency?: 'YER' | 'SAR' | 'USD';
}

export default function ProductQuickView({ product, isOpen, onClose, currency = 'YER' }: ProductQuickViewProps) {
  const t = useTranslations('Product');
  const displayCurrency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const renderedPrice = formatPrice(product.price, displayCurrency, rates, useManual, manualRate, t('currency'), currency);
  const renderedOriginalPrice = product.originalPrice 
    ? formatPrice(product.originalPrice, displayCurrency, rates, useManual, manualRate, t('currency'), currency) 
    : null;

  const handleAddToCart = () => {
    triggerHaptic('medium');
    addItem({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      image: product.image, 
      quantity, 
      currency 
    });
    onClose();
    // Reset quantity after a short delay
    setTimeout(() => setQuantity(1), 300);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('quickView')}>
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <Image 
            src={product.image} 
            alt={product.name} 
            fill 
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        
        <div className={styles.details}>
          <h2 className={styles.title}>{product.name}</h2>
          <div className={styles.priceContainer}>
            <span className={styles.price}>{renderedPrice}</span>
            {renderedOriginalPrice && (
              <span className={styles.originalPrice}>{renderedOriginalPrice}</span>
            )}
          </div>
          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}
        </div>

        <div className={styles.actionSection}>
          <div className={styles.quantityControl}>
            <button 
              className={styles.qtyBtn} 
              onClick={() => {
                if (quantity > 1) {
                  triggerHaptic('light');
                  setQuantity(q => q - 1);
                }
              }}
            >
              <Minus size={16} />
            </button>
            <span className={styles.qty}>{quantity}</span>
            <button 
              className={styles.qtyBtn} 
              onClick={() => {
                triggerHaptic('light');
                setQuantity(q => q + 1);
              }}
            >
              <Plus size={16} />
            </button>
          </div>
          
          <button className={styles.addToCartBtn} onClick={handleAddToCart}>
            <ShoppingBag size={20} />
            {t('addToCart')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
