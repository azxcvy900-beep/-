import React, { Suspense } from 'react';
import OrderSuccessContent from './OrderSuccessContent';
import Loading from './loading';

export default async function OrderSuccessPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <Suspense fallback={<Loading />}>
      <OrderSuccessContent />
    </Suspense>
  );
}


