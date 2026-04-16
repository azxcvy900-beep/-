import React, { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div />}>
      <CheckoutContent />
    </Suspense>
  );
}
