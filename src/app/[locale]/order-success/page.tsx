import React from 'react';
import OrderSuccessContent from './OrderSuccessContent';

export default async function OrderSuccessPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <OrderSuccessContent />;
}
