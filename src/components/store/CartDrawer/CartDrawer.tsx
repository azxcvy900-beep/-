'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet/BottomSheet';
import { useCartStore } from '@/lib/store';
import { formatPrice, triggerHaptic } from '@/lib/utils';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
}

export default function CartDrawer({ isOpen, onClose, storeSlug }: CartDrawerProps) {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const router = useRouter();
  
  const { items, updateQuantity, removeItem } = useCartStore();
  const displayCurrency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formattedTotal = formatPrice(
    calculateTotal(), 
    displayCurrency, 
    rates, 
    useManual, 
    manualRate, 
    t('currency'), 
    items[0]?.currency || 'YER'
  );

  const handleCheckout = () => {
    triggerHaptic('medium');
    onClose();
    router.push(`/${locale}/store/${storeSlug}/checkout`);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('cart')}>
      <div className={styles.container}>
        {items.length === 0 ? (
          <div className={styles.emptyCart}>
            <ShoppingBag size={48} opacity={0.5} />
            <p>{t('emptyCart')}</p>
          </div>
        ) : (
          <>
            <div className={styles.cartItems}>
              {items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    width={80} 
                    height={80} 
                    className={styles.itemImage}
                  />
                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.price, displayCurrency, rates, useManual, manualRate, t('currency'), item.currency)}
                    </span>
                    
                    <div className={styles.controlsRow}>
                      <div className={styles.quantityControl}>
                        <button 
                          className={styles.qtyBtn} 
                          onClick={() => {
                            if (item.quantity > 1) {
                              triggerHaptic('light');
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button 
                          className={styles.qtyBtn} 
                          onClick={() => {
                            triggerHaptic('light');
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      <button 
                        className={styles.removeBtn}
                        onClick={() => {
                          triggerHaptic('light');
                          removeItem(item.id);
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.footer}>
              <div className={styles.summaryRow}>
                <span>{t('total')}</span>
                <span>{formattedTotal}</span>
              </div>
              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                {t('checkout')}
                <ArrowRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
