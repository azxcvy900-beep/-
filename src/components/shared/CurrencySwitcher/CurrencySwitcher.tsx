'use client';

import React from 'react';
import { useCartStore } from '@/lib/store';
import { Globe } from 'lucide-react';
import styles from './CurrencySwitcher.module.css';

const CURRENCIES = [
  { code: 'YER', symbol: 'ر.ي', name: 'ريال يمني' },
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي' }
];

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCartStore();

  return (
    <div className={styles.container}>
      <Globe size={18} className={styles.icon} />
      <select 
        value={currency} 
        onChange={(e) => setCurrency(e.target.value)}
        className={styles.select}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} ({c.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}
