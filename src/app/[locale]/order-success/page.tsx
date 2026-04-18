import React, { Suspense, use } from 'react';
import OrderSuccessContent from './OrderSuccessContent';
import Loading from './loading';

function OrderSuccessContentWrapper({ params }: { params: Promise<{ locale: string }> }) {
  // Suspend here
  const { locale } = use(params);
  return <OrderSuccessContent />;
}

export default function OrderSuccessPage(props: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <OrderSuccessContentWrapper params={props.params} />
    </Suspense>
  );
}




