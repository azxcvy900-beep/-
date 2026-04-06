'use client';

import React, { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store';

interface StoreInitializerProps {
  rates?: { [key: string]: number };
  defaultCurrency?: string;
}

export default function StoreInitializer({ rates, defaultCurrency }: StoreInitializerProps) {
  const isInitialized = useRef(false);
  const setRates = useCartStore(state => state.setRates);
  const setCurrency = useCartStore(state => state.setCurrency);
  const currentCurrency = useCartStore(state => state.currency);

  useEffect(() => {
    if (!isInitialized.current) {
      if (rates) {
        setRates(rates);
      }
      // Only set default if user hasn't picked one yet
      if (defaultCurrency && currentCurrency === 'YER') {
        setCurrency(defaultCurrency);
      }
      isInitialized.current = true;
    }
  }, [rates, defaultCurrency, setRates, setCurrency, currentCurrency]);

  return null;
}
