/**
 * Shared utility for price formatting with multi-currency and manual rate support.
 */
export const formatPrice = (
  amount: number,
  currency: string,
  rates: { [key: string]: number },
  useManual: boolean,
  manualRate: number,
  yerLabel: string = 'ر.ي'
) => {
  if (currency === 'YER') {
    return `${amount.toLocaleString()} ${yerLabel}`;
  }

  let rate = rates[currency] || 1;
  
  // Use manual SAR rate if enabled
  if (currency === 'SAR' && useManual) {
    rate = manualRate;
  }

  const converted = amount / rate;
  const symbols: { [key: string]: string } = { 'SAR': 'ر.س', 'USD': '$' };
  const symbol = symbols[currency] || currency;

  return `${converted.toFixed(2)} ${symbol}`;
};
