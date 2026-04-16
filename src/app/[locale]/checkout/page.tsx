import React from 'react';
import CheckoutContent from './CheckoutContent';

export default async function CheckoutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <CheckoutContent />;
}
