import React, { Suspense, use } from 'react';
import CartContent from './CartContent';
import Loading from './loading';

export default function CartPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = use(props.params);
  return (
    <Suspense fallback={<Loading />}>
      <CartContent />
    </Suspense>
  );
}


