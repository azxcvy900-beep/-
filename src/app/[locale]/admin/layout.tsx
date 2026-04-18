
import React from 'react';
import AdminLayoutContent from './AdminLayoutContent';

export default function AdminLayout({ children }: { children: React.ReactNode }) {


  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
