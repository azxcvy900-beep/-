import React, { Suspense } from 'react';
import CartContent from './CartContent';

export default function CartPage() {
  return (
    <Suspense>
      <CartContent />
    </Suspense>
  );
}
