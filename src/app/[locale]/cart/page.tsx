import React, { Suspense, use } from 'react';
import CartContent from './CartContent';
import Loading from './loading';

function CartContentWrapper({ params }: { params: Promise<{ locale: string }> }) {
  // Suspend here, caught by the local Suspense
  const { locale } = use(params);
  return <CartContent />;
}

export default function CartPage(props: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <CartContentWrapper params={props.params} />
    </Suspense>
  );
}



