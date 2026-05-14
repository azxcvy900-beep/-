'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStoreInfo, StoreInfo, getPlatformSettings, PlatformSettings } from '@/lib/api';
import styles from '../../../../legal/legal.module.css';
import Loader from '@/components/shared/Loader/Loader';

export default function StorePrivacyPolicy() {
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
        console.error("Failed to load policies:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}>جاري تحميل السياسات...</div>;

  return (
    <div className={styles.legalContainer} dir="rtl" style={{ '--primary': store?.primaryColor } as any}>
      <aside className={styles.sidebar}>
        <h3>أقسام السياسة</h3>
        <nav className={styles.navLinks}>
          <a href="#store-policy" className={styles.navLink}>سياسة المتجر</a>
          <a href="#platform-policy" className={styles.navLink}>سياسة المنصة العامة</a>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <h1>سياسة الخصوصية والاستبدال</h1>
          <p className={styles.lastUpdated}>متجر: {store?.name || slug}</p>
        </header>

        <section id="store-policy" className={styles.section}>
          <h2>سياسة المتجر الخاصة</h2>
          {store?.privacyPolicy ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--foreground)' }}>
              {store.privacyPolicy}
            </div>
          ) : (
            <p>يطبق هذا المتجر سياسات الاسترجاع والخصوصية القياسية للمنصة.</p>
          )}
        </section>

        <hr style={{ margin: '4rem 0', opacity: 0.1 }} />

        <section id="platform-policy" className={styles.section}>
          <h2>سياسة منصة بايرز العامة</h2>
          <p className={styles.previewHint}>هذه هي الشروط الأساسية التي تحكم عمل المنصة وتضمن حقوق كافة الأطراف.</p>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
            {platform?.privacyPolicy || 'تطبق سياسة الخصوصية الموحدة للمنصة.'}
          </div>
        </section>
      </main>
    </div>
  );
}
