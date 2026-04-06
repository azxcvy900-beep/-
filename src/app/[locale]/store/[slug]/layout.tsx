import { Metadata } from 'next';
import Header from '@/components/shared/Header/Header';
import { getStoreInfo } from '@/lib/api';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreInfo(slug);
  const storeName = store?.name || (slug === 'demo' ? 'متجر بايرز التجريبي' : slug.toUpperCase());
  
  return {
    title: storeName,
    description: `تسوق من ${storeName} عبر منصة بايرز. أفضل المنتجات بأسعار منافسة في اليمن.`,
    openGraph: {
      title: storeName,
      description: `تسوق أونلاين من ${storeName}`,
    }
  };
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;
  const store = await getStoreInfo(slug);
  
  return (
    <>
      <Header 
        storeName={store?.name || slug.toUpperCase()} 
        storeLogo={store?.logo}
      />
      <main style={{ minHeight: '100vh', padding: '2rem 0' }}>
        {children}
      </main>
    </>
  );
}
