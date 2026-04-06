'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function AdminPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Redirect the base /admin path to the dashboard
    // The layout.tsx in the same folder will handle auth checks
    router.replace(`/${locale}/admin/dashboard`);
  }, [router, locale]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      جاري التحويل إلى لوحة التحكم...
    </div>
  );
}
