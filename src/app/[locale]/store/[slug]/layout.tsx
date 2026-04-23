import { Metadata } from 'next';
import Header from '@/components/shared/Header/Header';
import StoreInitializer from '@/components/shared/StoreInitializer/StoreInitializer';
import { getStoreInfo, getPlatformSettings } from '@/lib/api';
import MaintenancePage from '@/components/shared/MaintenancePage/MaintenancePage';
import BottomNav from '@/components/store/BottomNav/BottomNav';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreInfo(slug);
  const platform = await getPlatformSettings();

  if (platform.maintenanceMode) {
    return { title: 'المنصة تحت الصيانة | بايرز' };
  }

  const storeName = store?.name || (slug === 'demo' ? 'متجر بايرز التجريبي' : slug.toUpperCase());
  
  const seoTitle = store?.seo?.titleTemplate ? store.seo.titleTemplate.replace('%s', storeName) : storeName;
  const seoDesc = store?.seo?.description || `تسوق من ${storeName} عبر منصة بايرز. أفضل المنتجات بأسعار منافسة في اليمن.`;

  return {
    title: seoTitle,
    description: seoDesc,
    keywords: store?.seo?.keywords?.join(', '),
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      images: store?.logo ? [store.logo] : []
    },
    icons: {
      icon: store?.logo || '/favicon.ico',
      apple: store?.logo || '/apple-touch-icon.png',
    },
    manifest: `/api/manifest?slug=${slug}`
  };
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '59, 130, 246'; // Default fallback
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;
  
  const [store, platform] = await Promise.all([
    getStoreInfo(slug),
    getPlatformSettings()
  ]);

  if (platform.maintenanceMode) {
    return <MaintenancePage />;
  }

  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const primaryColor = (store?.primaryColor && colorRegex.test(store.primaryColor)) ? store.primaryColor : '#3b82f6';
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryColor = (store?.secondaryColor && colorRegex.test(store.secondaryColor)) ? store.secondaryColor : '#64748b';
  const secondaryRgb = hexToRgb(secondaryColor);

  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: ${primaryColor} !important;
          --primary-rgb: ${primaryRgb} !important;
          --secondary: ${secondaryColor} !important;
          --secondary-rgb: ${secondaryRgb} !important;
        }
      `}} />
      <StoreInitializer 
        rates={store?.currencySettings?.rates} 
        defaultCurrency={store?.currencySettings?.default} 
        useManualSARRate={store?.currencySettings?.useManualSARRate}
        manualSARRate={store?.currencySettings?.manualSARRate}
        shippingFee={store?.shippingFee}
      />
      <Header 
        storeName={store?.name || slug.toUpperCase()} 
        storeLogo={store?.logo}
      />
      <main style={{ minHeight: '100vh', padding: '2rem 0' }}>
        {children}
      </main>
      <BottomNav storeSlug={slug} />
    </>
  );
}
