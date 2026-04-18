import React, { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';
import Loading from './loading';

export default async function CheckoutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutContent />
    </Suspense>
  );
}

