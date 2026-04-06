'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Landmark, Upload, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import styles from './checkout.module.css';

type PaymentMethod = 'electronic' | 'transfer';

export default function CheckoutPage() {
  const t = useTranslations('Checkout');
  const pt = useTranslations('Product');
  const locale = useLocale();
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('electronic');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
    if (mounted && items.length === 0) {
      router.push(`/${locale}/cart`);
    }
  }, [mounted, items, router, locale]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceipt(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === 'transfer' && !receipt) {
      alert(t('errorReceiptRequired'));
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    clearCart();
    setIsSubmitting(false);
    router.push(`/${locale}/order-success`);
  };

  if (!mounted || items.length === 0) return null;

  return (
    <div className={styles.container}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <h1 className={styles.title}>{t('title')}</h1>
        <div className={styles.steps}>
          <span className={styles.stepActive}>{t('shippingAndPayment')}</span>
          <ChevronRight size={16} />
          <span>{t('confirmation')}</span>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className={styles.content}>
        <div className={styles.formSection}>
          <div className={styles.card}>
            <h3>{t('customerInfo')}</h3>
            <div className={styles.inputGroup}>
              <label htmlFor="fullName">{t('fullName')}</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder={t('fullNamePlaceholder')}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">{t('phone')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="77XXXXXXX"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="address">{t('address')}</label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                placeholder={t('addressPlaceholder')}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h3>{t('paymentMethod')}</h3>
            <div className={styles.paymentMethods}>
              <div 
                className={`${styles.methodOption} ${paymentMethod === 'electronic' ? styles.methodSelected : ''}`}
                onClick={() => setPaymentMethod('electronic')}
              >
                <div className={styles.methodHeader}>
                  <CreditCard size={24} />
                  <span>{t('electronicPayment')}</span>
                </div>
                <p>{t('electronicPaymentDesc')}</p>
                {paymentMethod === 'electronic' && <CheckCircle2 className={styles.checkIcon} size={20} />}
              </div>

              <div 
                className={`${styles.methodOption} ${paymentMethod === 'transfer' ? styles.methodSelected : ''}`}
                onClick={() => setPaymentMethod('transfer')}
              >
                <div className={styles.methodHeader}>
                  <Landmark size={24} />
                  <span>{t('transferPayment')}</span>
                </div>
                <p>{t('transferPaymentDesc')}</p>
                {paymentMethod === 'transfer' && <CheckCircle2 className={styles.checkIcon} size={20} />}
              </div>
            </div>

            <AnimatePresence>
              {paymentMethod === 'transfer' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={styles.uploadSection}
                >
                  <div className={styles.alert}>
                    <AlertCircle size={18} />
                    <p>{t('transferInstructions')}</p>
                  </div>
                  
                  <label className={styles.uploadBox}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className={styles.fileInput}
                    />
                    {receiptPreview ? (
                      <div className={styles.previewContainer}>
                        <img src={receiptPreview} alt="Receipt Preview" className={styles.previewImage} />
                        <div className={styles.changeOverlay}>
                          <Upload size={20} />
                          <span>{t('changePhoto')}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <Upload size={32} />
                        <span>{t('uploadReceipt')}</span>
                        <p>{t('uploadReceiptDesc')}</p>
                      </div>
                    )}
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={styles.summarySection}>
          <div className={styles.card}>
            <h3>{t('orderSummary')}</h3>
            <div className={styles.miniList}>
              {items.map(item => (
                <div key={item.id} className={styles.miniItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString()} {pt('currency')}</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryTotal}>
              <div className={styles.totalRow}>
                <span>{t('total')}</span>
                <span className={styles.totalPrice}>
                  {getTotalPrice().toLocaleString()} {pt('currency')}
                </span>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={styles.placeOrderBtn}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className={styles.spinner}
                />
              ) : (
                t('placeOrder')
              )}
            </button>
            
            <p className={styles.securityNote}>
              <CheckCircle2 size={14} />
              {t('secureCheckout')}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
