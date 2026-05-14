import React from 'react';
import styles from '../legal.module.css';

export const metadata = {
  title: 'شروط وأحكام الاستخدام | بايرز',
  description: 'اتفاقية شروط الاستخدام لمنصة بايرز للتجار والعملاء في الجمهورية اليمنية.',
};

export default function TermsOfServicePage() {
  return (
    <div className={styles.legalContainer} dir="rtl">
      <aside className={styles.sidebar}>
        <h3>الأقسام</h3>
        <nav className={styles.navLinks}>
          <a href="#general" className={styles.navLink}>أحكام عامة</a>
          <a href="#merchants" className={styles.navLink}>شروط التجار (المتاجر)</a>
          <a href="#customers" className={styles.navLink}>شروط العملاء (المتسوقين)</a>
          <a href="#subscriptions" className={styles.navLink}>الاشتراكات والرسوم</a>
          <a href="#prohibited" className={styles.navLink}>الأنشطة المحظورة</a>
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
            تعد هذه الاتفاقية عقداً ملزماً بينك وبين منصة "بايرز" (Buyers). باستخدامك للمنصة، فإنك تقر بقراءة وفهم والالتزام بكافة الشروط المذكورة هنا. 
            تحتفظ المنصة بالحق في تحديث هذه الشروط في أي وقت، وسيتم إخطار المستخدمين بأي تغييرات جوهرية.
          </p>
        </section>

        <section id="merchants" className={styles.section}>
          <h2>شروط التجار (أصحاب المتاجر)</h2>
          <p>يلتزم التاجر عند فتح متجر على المنصة بما يلي:</p>
          <ul>
            <li>تقديم معلومات صحيحة ودقيقة حول الهوية التجارية والمنتجات.</li>
            <li>تحمل المسؤولية الكاملة عن جودة المنتجات المعروضة ومطابقتها للوصف.</li>
            <li>الالتزام بشحن الطلبات للعملاء في المواعيد المحددة.</li>
            <li>عدم عرض أي منتجات تخالف الأنظمة في الجمهورية اليمنية أو حقوق الملكية الفكرية.</li>
            <li>تحمل المسؤولية عن أي نزاعات تنشأ مع العملاء بخصوص المنتجات.</li>
          </ul>
        </section>

        <section id="customers" className={styles.section}>
          <h2>شروط العملاء (المتسوقين)</h2>
          <p>عند الشراء عبر المنصة، يقر العميل بما يلي:</p>
          <ul>
            <li>أن المعلومات المقدمة (الاسم، العنوان، رقم الجوال) صحيحة لضمان وصول الطلب.</li>
            <li>الالتزام بدفع قيمة المشتريات والرسوم المرتبطة بها (مثل رسوم التوصيل).</li>
            <li>إتمام عملية الشراء يعد عقداً مباشراً بين العميل والتاجر، وتعمل المنصة كوسيط تقني.</li>
            <li>الالتزام بسياسة الاستبدال والاسترجاع الموضحة في متجر التاجر.</li>
          </ul>
        </section>

        <section id="subscriptions" className={styles.section}>
          <h2>الاشتراكات والرسوم</h2>
          <p>
            تقدم المنصة باقات اشتراك متنوعة للتجار. يلتزم التاجر بدفع الرسوم المرتبطة بالباقة المختارة (سواء كانت شهرية أو سنوية) والعمولات المتفق عليها لكل عملية بيع. 
            سيتم توضيح كافة تفاصيل الباقات والأسعار في صفحة "باقات الاشتراك" المخصصة لذلك.
          </p>
        </section>

        <section id="prohibited" className={styles.section}>
          <h2>الأنشطة المحظورة</h2>
          <p>يُمنع منعاً باتاً القيام بأي من الأنشطة التالية:</p>
          <ul>
            <li>استخدام المنصة لأي غرض غير قانوني أو احتيالي.</li>
            <li>نشر محتوى مضلل أو مسيء أو ينتهك حقوق الآخرين.</li>
            <li>محاولة اختراق المنصة أو التدخل في عمل أنظمتها.</li>
            <li>جمع بيانات المستخدمين الآخرين دون موافقتهم.</li>
          </ul>
        </section>

        <section id="liability" className={styles.section}>
          <h2>إخلاء المسؤولية</h2>
          <p>
            تبذل منصة "بايرز" قصارى جهدها لضمان استقرار الخدمة، ولكنها لا تضمن عدم حدوث انقطاعات تقنية خارجة عن إرادتها. 
            المنصة غير مسؤولة عن جودة المنتجات أو أخطاء الشحن التي تعود للتجار أو شركات الشحن، ولكنها تعمل كوسيط لحل النزاعات بشكل عادل.
          </p>
        </section>

        <section id="law" className={styles.section}>
          <h2>القانون الواجب التطبيق</h2>
          <p>
            تخضع هذه الاتفاقية للأنظمة والقوانين النافذة في <strong>الجمهورية اليمنية</strong>، 
            وأي نزاع ينشأ عن تنفيذها أو تفسيرها يُحل أمام الجهات القضائية المختصة في الجمهورية اليمنية.
          </p>
        </section>

        <section className={styles.section}>
          <h2>التواصل معنا</h2>
          <p>لأي استفسارات قانونية بخصوص الشروط والأحكام، يرجى مراسلتنا على: legal@buyers.com</p>
        </section>
      </main>
    </div>
  );
}
