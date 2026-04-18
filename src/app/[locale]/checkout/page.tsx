import React, { Suspense, use } from 'react';
import CheckoutContent from './CheckoutContent';
import Loading from './loading';

export default function CheckoutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = use(props.params);
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutContent />
    </Suspense>
  );
}


