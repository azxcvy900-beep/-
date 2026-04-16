import React, { Suspense } from 'react';
import OrderSuccessContent from './OrderSuccessContent';

export const dynamic = 'force-dynamic';

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
