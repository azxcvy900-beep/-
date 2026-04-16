import React, { Suspense } from 'react';
import CartContent from './CartContent';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <Suspense fallback={<div />}>
      <CartContent />
    </Suspense>
  );
}
