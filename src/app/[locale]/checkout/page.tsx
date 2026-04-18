import React, { Suspense, use } from 'react';
import CheckoutContent from './CheckoutContent';
import Loading from './loading';

function CheckoutContentWrapper({ params }: { params: Promise<{ locale: string }> }) {
  // Suspend here
  const { locale } = use(params);
  return <CheckoutContent />;
}

export default function CheckoutPage(props: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutContentWrapper params={props.params} />
    </Suspense>
  );
}



