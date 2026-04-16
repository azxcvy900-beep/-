import React, { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';

export default async function CheckoutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;

  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>جاري التحميل...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
