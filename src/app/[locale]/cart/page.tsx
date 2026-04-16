import React, { Suspense } from 'react';
import CartContent from './CartContent';

export default async function CartPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;

  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>جاري التحميل...</div>}>
      <CartContent />
    </Suspense>
  );
}
