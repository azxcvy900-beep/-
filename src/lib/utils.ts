/**
 * Shared utility for price formatting with multi-currency and manual rate support.
 */
export const formatPrice = (
  amount: number,
  displayCurrency: string,
  rates: { [key: string]: number },
  useManual: boolean,
  manualRate: number,
  yerLabel: string = 'ر.ي',
  sourceCurrency: string = 'YER'
) => {
  // 1. Convert everything to YER first
  let amountInYER = amount;
  
  if (sourceCurrency === 'SAR') {
    const sarToYer = useManual ? manualRate : (rates['SAR'] || 140);
    amountInYER = amount * sarToYer;
  } else if (sourceCurrency === 'USD') {
    const usdToYer = rates['USD'] || 530;
    amountInYER = amount * usdToYer;
  }

  // 2. Convert from YER to Display Currency
  if (displayCurrency === 'YER') {
    return `${Math.round(amountInYER).toLocaleString()} ${yerLabel}`;
  }

  let rate = rates[displayCurrency] || 1;
  if (displayCurrency === 'SAR' && useManual) {
    rate = manualRate;
  }

  const converted = amountInYER / rate;
  const symbols: { [key: string]: string } = { 'SAR': 'ر.س', 'USD': '$' };
  const symbol = symbols[displayCurrency] || displayCurrency;

  return `${converted.toFixed(2)} ${symbol}`;
};
