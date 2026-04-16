import React, { Suspense } from 'react';
import OrderSuccessContent from './OrderSuccessContent';

export default async function OrderSuccessPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;

  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>جاري التحميل...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
