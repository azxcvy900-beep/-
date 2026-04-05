import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['ar', 'en'];

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  
  if (!locale || !locales.includes(locale)) {
    locale = 'ar';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

