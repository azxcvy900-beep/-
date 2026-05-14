'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStoreInfo, StoreInfo, getPlatformSettings, PlatformSettings } from '@/lib/api';
import styles from '../../../../legal/legal.module.css';

export default function StoreTermsOfService() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [platform, setPlatform] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [storeData, platformData] = await Promise.all([
          getStoreInfo(slug),
          getPlatformSettings()
        ]);
        setStore(storeData);
        setPlatform(platformData);
      } catch (error) {
        console.error("Failed to load terms:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}>جاري تحميل الشروط...</div>;

  return (
    <div className={styles.legalContainer} dir="rtl" style={{ '--primary': store?.primaryColor } as any}>
      <aside className={styles.sidebar}>
        <h3>الأقسام</h3>
        <nav className={styles.navLinks}>
          <a href="#store-terms" className={styles.navLink}>شروط المتجر</a>
          <a href="#platform-terms" className={styles.navLink}>اتفاقية المنصة</a>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <h1>شروط وأحكام الاستخدام</h1>
          <p className={styles.lastUpdated}>متجر: {store?.name || slug}</p>
        </header>

        <section id="store-terms" className={styles.section}>
          <h2>شروط الخدمة الخاصة بالمتجر</h2>
          {store?.termsOfService ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--foreground)' }}>
              {store.termsOfService}
            </div>
          ) : (
            <p>يطبق هذا المتجر شروط وأحكام الاستخدام القياسية لمنصة بايرز.</p>
          )}
        </section>

        <hr style={{ margin: '4rem 0', opacity: 0.1 }} />

        <section id="platform-terms" className={styles.section}>
          <h2>اتفاقية استخدام منصة بايرز</h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
            {platform?.termsOfService || 'تطبق شروط الاستخدام الموحدة للمنصة.'}
          </div>
        </section>
      </main>
    </div>
  );
}
