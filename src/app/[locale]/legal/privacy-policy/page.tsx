'use client';

import React, { useEffect, useState } from 'react';
import { getPlatformSettings, PlatformSettings } from '@/lib/api';
import styles from '../legal.module.css';

export default function PrivacyPolicyPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    getPlatformSettings().then(setSettings);
  }, []);

  return (
    <div className={styles.legalContainer} dir="rtl">
      <aside className={styles.sidebar}>
        <h3>الأقسام</h3>
        <nav className={styles.navLinks}>
          <a href="#intro" className={styles.navLink}>مقدمة</a>
          {!settings?.privacyPolicy ? (
            <>
              <a href="#data-collection" className={styles.navLink}>البيانات التي نجمعها</a>
              <a href="#data-usage" className={styles.navLink}>كيفية استخدام البيانات</a>
              <a href="#data-sharing" className={styles.navLink}>مشاركة البيانات</a>
            </>
          ) : (
            <a href="#content" className={styles.navLink}>البنود والتفاصيل</a>
          )}
          <a href="#security" className={styles.navLink}>أمن المعلومات</a>
          <a href="#rights" className={styles.navLink}>حقوق المستخدم</a>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <h1>سياسة الخصوصية</h1>
          <p className={styles.lastUpdated}>آخر تحديث: 14 مايو 2026</p>
        </header>

        <section id="intro" className={styles.section}>
          <h2>مقدمة</h2>
          <p>
            مرحباً بكم في منصة "بايرز" (Buyers). نحن نقدر ثقتكم بنا ونلتزم بحماية خصوصية بياناتكم الشخصية. 
            توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتكم عند استخدامكم لمنصتنا، سواء كنتم تجاراً أو عملاء.
          </p>
        </section>

        {settings?.privacyPolicy ? (
          <section id="content" className={styles.section}>
            <h2>سياسة المنصة الرسمية</h2>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--muted-foreground)' }}>
              {settings.privacyPolicy}
            </div>
          </section>
        ) : (
          <>
            <section id="data-collection" className={styles.section}>
              <h2>البيانات التي نجمعها</h2>
              <ul>
                <li><strong>للتجار:</strong> معلومات الهوية التجارية، الحسابات البنكية، وبيانات التواصل.</li>
                <li><strong>للعملاء:</strong> الاسم، رقم الجوال، وعناوين التوصيل.</li>
              </ul>
            </section>
            
            <section id="data-usage" className={styles.section}>
              <h2>كيفية استخدام البيانات</h2>
              <p>نستخدم البيانات لإتمام الطلبات، تحويل المستحقات، وتحسين تجربة المستخدم.</p>
            </section>

            <section id="data-sharing" className={styles.section}>
              <h2>مشاركة البيانات</h2>
              <p>نشارك البيانات مع شركات الشحن وبوابات الدفع لضمان تقديم الخدمة.</p>
            </section>
          </>
        )}

        <section id="security" className={styles.section}>
          <h2>أمن المعلومات</h2>
          <p>
            نحن نطبق معايير أمنية عالية لتشفير وحماية البيانات الحساسة. ومع ذلك، يرجى تذكر أنه لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة 100%.
          </p>
        </section>

        <section id="rights" className={styles.section}>
          <h2>حقوق المستخدم</h2>
          <p>يحق لكم الوصول لبياناتكم وتعديلها أو طلب حذفها بما لا يتعارض مع الأنظمة المالية والقانونية في الجمهورية اليمنية.</p>
        </section>

        <section className={styles.section}>
          <h2>التواصل معنا</h2>
          <p>إذا كان لديكم أي استفسار، يرجى التواصل معنا عبر البريد الإلكتروني: {settings?.contactEmail || 'support@buyers.com'}</p>
        </section>
      </main>
    </div>
  );
}
