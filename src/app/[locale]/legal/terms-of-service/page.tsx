'use client';

import React, { useEffect, useState } from 'react';
import { getPlatformSettings, PlatformSettings } from '@/lib/api';
import styles from '../legal.module.css';

export default function TermsOfServicePage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    getPlatformSettings().then(setSettings);
  }, []);

  return (
    <div className={styles.legalContainer} dir="rtl">
      <aside className={styles.sidebar}>
        <h3>الأقسام</h3>
        <nav className={styles.navLinks}>
          <a href="#general" className={styles.navLink}>أحكام عامة</a>
          {!settings?.termsOfService ? (
            <>
              <a href="#merchants" className={styles.navLink}>شروط التجار</a>
              <a href="#customers" className={styles.navLink}>شروط العملاء</a>
            </>
          ) : (
            <a href="#content" className={styles.navLink}>بنود الاتفاقية</a>
          )}
          <a href="#liability" className={styles.navLink}>إخلاء المسؤولية</a>
          <a href="#law" className={styles.navLink}>القانون الواجب التطبيق</a>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <h1>شروط وأحكام الاستخدام</h1>
          <p className={styles.lastUpdated}>آخر تحديث: 14 مايو 2026</p>
        </header>

        <section id="general" className={styles.section}>
          <h2>أحكام عامة</h2>
          <p>
            تعد هذه الاتفاقية عقداً ملزماً بينك وبين منصة "بايرز" (Buyers). باستخدامك للمنصة، فإنك تقر بالالتزام بكافة الشروط المذكورة.
          </p>
        </section>

        {settings?.termsOfService ? (
          <section id="content" className={styles.section}>
            <h2>اتفاقية الخدمة الرسمية</h2>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--muted-foreground)' }}>
              {settings.termsOfService}
            </div>
          </section>
        ) : (
          <>
            <section id="merchants" className={styles.section}>
              <h2>شروط التجار (المتاجر)</h2>
              <p>يلتزم التاجر بتقديم معلومات صحيحة، وتحمل مسؤولية جودة المنتجات، والالتزام بمواعيد الشحن.</p>
            </section>

            <section id="customers" className={styles.section}>
              <h2>شروط العملاء (المتسوقين)</h2>
              <p>يلتزم العميل بتقديم بيانات دقيقة ودفع قيمة المشتريات وفقاً لطرق الدفع المتاحة.</p>
            </section>
          </>
        )}

        <section id="liability" className={styles.section}>
          <h2>إخلاء المسؤولية</h2>
          <p>
            تعمل المنصة كوسيط تقني، وهي غير مسؤولة عن النزاعات التجارية المباشرة بين التاجر والعميل، ولكنها تسعى لحلها ودياً.
          </p>
        </section>

        <section id="law" className={styles.section}>
          <h2>القانون الواجب التطبيق</h2>
          <p>
            تخضع هذه الاتفاقية للأنظمة والقوانين النافذة في <strong>الجمهورية اليمنية</strong>.
          </p>
        </section>

        <section className={styles.section}>
          <h2>التواصل القانوني</h2>
          <p>لأي استفسارات، يرجى مراسلتنا على: {settings?.contactEmail || 'legal@buyers.com'}</p>
        </section>
      </main>
    </div>
  );
}
