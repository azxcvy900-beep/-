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

/**
 * Compresses an image file on the client side using Canvas API.
 * Reducing dimensions and quality to make uploads lightning fast.
 */
export const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas blob construction failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    reader.onerror = () => reject(new Error('File reading failed'));
  });
};
