import React from 'react';
import Header from '@/components/shared/Header/Header';

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default function StoreLayout({ children, params }: StoreLayoutProps) {
  const resolvedParams = React.use(params);
  // In a real app, fetch store info based on slug
  const storeName = resolvedParams.slug === 'tech' ? 'تيك ستور' : 'متجر بايرز';
  
  return (
    <>
      <Header storeName={storeName} />
      <main style={{ minHeight: '100vh', padding: '2rem 0' }}>
        {children}
      </main>
    </>
  );
}
