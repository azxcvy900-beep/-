import React, { Suspense } from 'react';
import CartContent from './CartContent';
import Loading from './loading';

export default async function CartPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <Suspense fallback={<Loading />}>
      <CartContent />
    </Suspense>
  );
}

