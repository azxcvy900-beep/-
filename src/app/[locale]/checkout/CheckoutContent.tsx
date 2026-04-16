'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, ChevronRight, MapPin, Plus, Landmark, CreditCard, Upload } from 'lucide-react';
import { useCartStore, UserInfo, Order } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import BackButton from '@/components/shared/BackButton/BackButton';
import { validateCoupon, Coupon } from '@/lib/api';
import { toast } from 'sonner';
import styles from './checkout.module.css';

type PaymentMethod = 'electronic' | 'transfer';

export default function CheckoutContent() {
  const t = useTranslations('Checkout');
  const pt = useTranslations('Product');
  const locale = useLocale();
  const router = useRouter();
  
  const { 
    items, 
    getTotalPrice, 
    clearCart, 
    addresses, 
    selectedAddressId, 
    addAddress, 
    removeAddress, 
    setSelectedAddress 
  } = useCartStore();

  const currency = useCartStore(state => state.currency);
  const rates = useCartStore(state => state.rates);
  const useManual = useCartStore(state => state.useManualSARRate);
  const manualRate = useCartStore(state => state.manualSARRate);
  const shippingFee = useCartStore(state => state.shippingFee);

  const getCurrentSARRate = () => {
    if (currency === 'SAR' && useManual) return manualRate;
    return rates['SAR'] || 140;
  };

  const formatPriceLocal = (amount: number) => {
    return formatPrice(amount, currency, rates, useManual, manualRate, pt('currency'));
  };
  
  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('electronic');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    region: '',
    details: '',
    label: 'home' as 'home' | 'work' | 'other'
  });

  const [longPressId, setLongPressId] = useState<string | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [lockedRate, setLockedRate] = useState<number | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && items.length === 0) {
      router.push(`/${locale}/cart`);
    }

    if (mounted && addresses.length > 0 && !selectedAddressId) {
      const first = addresses[0];
      setSelectedAddress(first.id);
      setFormData({
        fullName: first.fullName,
        phone: first.phone,
        city: first.city,
        region: first.region,
        details: first.details,
        label: first.label
      });
    } else if (mounted && addresses.length === 0) {
      setIsAddingNew(true);
    }
  }, [mounted, items, router, locale, addresses, selectedAddressId, setSelectedAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (selectedAddressId) {
      setSelectedAddress('');
    }
  };

  const handleSelectAddress = (addr: UserInfo) => {
    setSelectedAddress(addr.id);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      city: addr.city,
      region: addr.region,
      details: addr.details,
      label: addr.label
    });
    setIsAddingNew(false);
  };

  const startLongPress = (id: string) => {
    setLongPressId(id);
    longPressTimer.current = setTimeout(() => {
      if (confirm(t('confirmDeleteAddress') || 'حذف هذا العنوان؟')) {
        removeAddress(id);
        if (selectedAddressId === id) {
          setFormData({ fullName: '', phone: '', city: '', region: '', details: '', label: 'home' });
          setIsAddingNew(true);
        }
      }
      setLongPressId(null);
    }, 800);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressId(null);
  };

  const handleAddAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.city || !formData.region) {
      toast.error(t('errorIncompleteInfo'));
      return;
    }

    const newAddress: UserInfo = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    };

    addAddress(newAddress);
    setIsAddingNew(false);
    setSelectedAddress(newAddress.id);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsCheckingCoupon(true);
    setCouponError(null);
    try {
      const coupon = await validateCoupon('demo', couponCode.toUpperCase(), getTotalPrice());
      if (coupon) {
        setAppliedCoupon(coupon);
        setCouponError(null);
      } else {
        setCouponError(t('invalidCoupon'));
      }
    } catch (error) {
      setCouponError(t('errorCheckCoupon'));
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getTotalPrice();
    if (appliedCoupon.type === 'percent') {
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      return appliedCoupon.value;
    }
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
      const subtotal = getTotalPrice();
      const discount = calculateDiscount();
      const currentTotal = Math.max(0, subtotal - discount + shippingFee);
      setLockedPrice(currentTotal);
      setLockedRate(getCurrentSARRate());
    } else {
      setReceipt(null);
      setReceiptPreview(null);
      setLockedPrice(null);
      setLockedRate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId && (!formData.fullName || !formData.phone)) {
      toast.error(t('errorIncompleteInfo'));
      return;
    }
    if (paymentMethod === 'transfer' && !receipt) {
      toast.error(t('errorReceiptRequired'));
      return;
    }
    setIsSubmitting(true);
    const subtotal = getTotalPrice();
    const discount = calculateDiscount();
    const finalTotal = lockedPrice !== null ? lockedPrice : Math.max(0, subtotal - discount + shippingFee);
    const autoConfirmMethod = paymentMethod === 'electronic' || (paymentMethod === 'transfer' && receipt);
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      items: [...items],
      subtotal: subtotal,
      discountAmount: discount,
      couponCode: appliedCoupon?.code,
      total: finalTotal,
      status: autoConfirmMethod ? 'processing' : 'pending',
      date: new Date().toISOString(),
      address: addresses.find(a => a.id === selectedAddressId) || (formData as any),
      paymentMethod: paymentMethod,
      lockedExRate: lockedRate || (receipt ? getCurrentSARRate() : undefined),
      isPriceLocked: !!receipt
    };
    try {
      const { submitOrder } = await import('@/lib/api');
      const currentStore = useCartStore.getState().storeSlug || 'demo';
      await submitOrder(newOrder, currentStore);
      useCartStore.getState().addOrder(newOrder);
      clearCart();
      router.push(`/${locale}/order-success`);
    } catch (error: any) {
      console.error("Order submission failed:", error);
      if (error.message?.startsWith('out_of_stock:')) {
        const productName = error.message.split(':')[1] || '';
        toast.error(t('outOfStock', { product: productName }));
      } else {
        toast.error(t('orderError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || items.length === 0) return null;

  return (
    <div className={styles.container}>
      <BackButton fallbackPath={`/${locale}/cart`} />
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
            <div className={styles.addressRow}>
              {addresses.map((addr) => (
                <div key={addr.id} className={styles.addressIconWrapper}>
                  <motion.div
                    className={`${styles.iconCircle} ${selectedAddressId === addr.id ? styles.iconCircleActive : ''}`}
                    onClick={() => handleSelectAddress(addr)}
                    onMouseDown={() => startLongPress(addr.id)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => startLongPress(addr.id)}
                    onTouchEnd={cancelLongPress}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MapPin size={24} />
                    {selectedAddressId === addr.id && (
                      <motion.div className={styles.iconSelectionMarker} layoutId="marker">
                        <CheckCircle2 size={14} />
                      </motion.div>
                    )}
                    {longPressId === addr.id && (
                      <motion.div 
                        className={styles.longPressPulse}
                        animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  <span className={`${styles.iconLabel} ${selectedAddressId === addr.id ? styles.iconLabelActive : ''}`}>
                    {addr.region}
                  </span>
                </div>
              ))}
              <div className={styles.addressIconWrapper}>
                <motion.div 
                  className={`${styles.iconCircle} ${styles.addIconCircle} ${isAddingNew ? styles.iconCircleActive : ''}`}
                  onClick={() => {
                    setIsAddingNew(true);
                    setSelectedAddress('');
                    setFormData({ fullName: '', phone: '', city: '', region: '', details: '', label: 'home' });
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={24} />
                </motion.div>
                <span className={`${styles.iconLabel} ${isAddingNew ? styles.iconLabelActive : ''}`}>
                  {t('addAddress')}
                </span>
              </div>
            </div>

            <div className={styles.newAddressForm}>
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

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="city">{t('city')}</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder={t('city')}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="region">{t('region')}</label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    required
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder={t('region')}
                  />
                </div>
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
                <label htmlFor="details">{t('extraDetails')}</label>
                <textarea
                  id="details"
                  name="details"
                  rows={2}
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder={t('addressPlaceholder')}
                />
              </div>

              {isAddingNew && (
                <button 
                  type="button" 
                  className={styles.placeOrderBtn}
                  onClick={handleAddAddress}
                  style={{ marginBottom: '1rem' }}
                >
                  {t('addAddress')}
                </button>
              )}
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
                  {lockedPrice !== null && (
                    <motion.div 
                      key="locked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={styles.lockedBadge}
                    >
                      <CheckCircle2 size={14} />
                      {t('priceFrozenDesc')}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={styles.summarySection}>
          <div className={styles.card}>
            <h3>{t('orderSummary')}</h3>
            
            <div className={styles.couponSection}>
              <div className={styles.couponInputWrapper}>
                <input 
                  type="text" 
                  placeholder={t('couponPlaceholder')} 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className={styles.couponInput}
                  disabled={!!appliedCoupon || isCheckingCoupon}
                />
                <button 
                  type="button" 
                  onClick={handleApplyCoupon}
                  className={styles.couponBtn}
                  disabled={!couponCode || !!appliedCoupon || isCheckingCoupon}
                >
                  {isCheckingCoupon ? '...' : (appliedCoupon ? <CheckCircle2 size={18} /> : t('apply'))}
                </button>
              </div>
              {couponError && <p className={styles.couponError}>{couponError}</p>}
              {appliedCoupon && (
                <div className={styles.appliedCoupon}>
                  <span>{t('couponApplied')} <strong>{appliedCoupon.code}</strong></span>
                  <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className={styles.removeCoupon}>{t('remove')}</button>
                </div>
              )}
            </div>

            <div className={styles.miniList}>
              {items.map(item => (
                <div key={`${item.id}-${JSON.stringify(item.selectedOptions)}`} className={styles.miniItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatPriceLocal(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className={styles.summaryTotal}>
              <div className={styles.summaryRow}>
                <span>{t('subtotal')}</span>
                <span>{formatPriceLocal(getTotalPrice())}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>{t('shippingFee')}</span>
                <span>{shippingFee > 0 ? formatPriceLocal(shippingFee) : t('free')}</span>
              </div>
              
              {appliedCoupon && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span>{t('discount')} ({appliedCoupon.code})</span>
                  <span>-{formatPriceLocal(calculateDiscount())}</span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span>{t('total')}</span>
                <span className={`${styles.totalPrice} ${lockedPrice !== null ? styles.priceLocked : ''}`}>
                  {formatPriceLocal(lockedPrice !== null ? lockedPrice : (getTotalPrice() - calculateDiscount() + shippingFee))}
                  {lockedPrice !== null && <span title={t('priceFrozen')}><CheckCircle2 size={16} /></span>}
                </span>
              </div>
              
              {lockedRate !== null && lockedPrice !== null && (
                <div className={styles.exchangeRateNote}>
                  {t('exchangeRateAdopted')} {lockedRate}
                </div>
              )}
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
                  style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}
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
