'use client';

import React, { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store';

interface StoreInitializerProps {
  rates?: { [key: string]: number };
  defaultCurrency?: string;
  useManualSARRate?: boolean;
  manualSARRate?: number;
  shippingFee?: number;
}

export default function StoreInitializer({ 
  rates, 
  defaultCurrency, 
  useManualSARRate, 
  manualSARRate,
  shippingFee 
}: StoreInitializerProps) {
  const isInitialized = useRef(false);
  const setShippingFee = useCartStore(state => state.setShippingFee);
  const setRates = useCartStore(state => state.setRates);
  const setCurrency = useCartStore(state => state.setCurrency);
  const setManualRate = useCartStore(state => state.setManualRate);
  const currentCurrency = useCartStore(state => state.currency);

  useEffect(() => {
    if (!isInitialized.current) {
      if (rates) {
        setRates(rates);
      }
      if (typeof useManualSARRate === 'boolean') {
        setManualRate(useManualSARRate, manualSARRate || 140);
      }
      if (typeof shippingFee === 'number') {
        setShippingFee(shippingFee);
      }
      // Only set default if user hasn't picked one yet
      if (defaultCurrency && currentCurrency === 'YER') {
        setCurrency(defaultCurrency);
      }
      isInitialized.current = true;
    }
  }, [rates, defaultCurrency, useManualSARRate, manualSARRate, shippingFee, setRates, setCurrency, setManualRate, setShippingFee, currentCurrency]);

  return null;
}
