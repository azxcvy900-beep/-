import { Metadata } from 'next';
import Header from '@/components/shared/Header/Header';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const storeName = slug === 'demo' ? 'متجر بايرز التجريبي' : slug.toUpperCase();
  
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
  // In a real app, fetch store info based on slug
  const storeName = slug === 'demo' ? 'بايرز ستور' : slug.toUpperCase();
  
  return (
    <>
      <Header storeName={storeName} />
      <main style={{ minHeight: '100vh', padding: '2rem 0' }}>
        {children}
      </main>
    </>
  );
}
