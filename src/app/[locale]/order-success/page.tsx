import React, { Suspense, use } from 'react';
import OrderSuccessContent from './OrderSuccessContent';
import Loading from './loading';

export default function OrderSuccessPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = use(props.params);
  return (
    <Suspense fallback={<Loading />}>
      <OrderSuccessContent />
    </Suspense>
  );
}



