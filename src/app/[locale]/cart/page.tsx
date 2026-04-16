import React from 'react';
import CartContent from './CartContent';

export default async function CartPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <CartContent />;
}
