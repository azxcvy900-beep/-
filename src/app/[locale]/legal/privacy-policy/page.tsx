import React from 'react';
import styles from '../legal.module.css';

export const metadata = {
  title: 'سياسة الخصوصية | بايرز',
  description: 'سياسة الخصوصية لمنصة بايرز - كيف نحمي بياناتك ونحترم خصوصيتك في الجمهورية اليمنية.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.legalContainer} dir="rtl">
      <aside className={styles.sidebar}>
        <h3>الأقسام</h3>
        <nav className={styles.navLinks}>
          <a href="#intro" className={styles.navLink}>مقدمة</a>
          <a href="#data-collection" className={styles.navLink}>البيانات التي نجمعها</a>
          <a href="#data-usage" className={styles.navLink}>كيفية استخدام البيانات</a>
          <a href="#data-sharing" className={styles.navLink}>مشاركة البيانات</a>
          <a href="#security" className={styles.navLink}>أمن المعلومات</a>
          <a href="#rights" className={styles.navLink}>حقوق المستخدم</a>
          <a href="#cookies" className={styles.navLink}>ملفات تعريف الارتباط</a>
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
            توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتكم عند استخدامكم لمنصتنا، سواء كنتم تجاراً (أصحاب متاجر) أو عملاء (متسوقين).
          </p>
          <p>
            باستخدامكم للمنصة، فإنكم توافقون على جمع واستخدام المعلومات وفقاً لهذه السياسة وللقوانين النافذة في الجمهورية اليمنية.
          </p>
        </section>

        <section id="data-collection" className={styles.section}>
          <h2>البيانات التي نجمعها</h2>
          <p>نحن نجمع أنواعاً مختلفة من المعلومات لتقديم وتحسين خدماتنا لكم:</p>
          <ul>
            <li><strong>للتجار:</strong> نجمع الاسم التجاري، رقم الجوال، عنوان المتجر، الهوية الشخصية (للتحقق)، وبيانات الحساب البنكي لتحويل المستحقات.</li>
            <li><strong>للعملاء:</strong> نجمع الاسم، رقم الجوال، عنوان الشحن، وتاريخ الطلبات لغرض توصيل المشتريات.</li>
            <li><strong>البيانات التقنية:</strong> مثل عنوان IP، نوع المتصفح، ومعلومات الجهاز المستخدم لضمان أمان المنصة.</li>
          </ul>
        </section>

        <section id="data-usage" className={styles.section}>
          <h2>كيفية استخدام البيانات</h2>
          <p>نستخدم البيانات التي نجمعها للأغراض التالية:</p>
          <ul>
            <li>إتمام عمليات الشراء وتوصيل الطلبات للعملاء.</li>
            <li>إدارة حسابات التجار وتحويل الأرباح والمستحقات.</li>
            <li>تحسين تجربة المستخدم وتطوير ميزات المنصة.</li>
            <li>التواصل معكم بخصوص التحديثات أو الدعم الفني.</li>
            <li>منع الاحتيال وضمان أمان العمليات المالية.</li>
          </ul>
        </section>

        <section id="data-sharing" className={styles.section}>
          <h2>مشاركة البيانات مع أطراف ثالثة</h2>
          <p>نحن لا نبيع بياناتكم الشخصية. نشارك المعلومات فقط مع الجهات الضرورية لتشغيل الخدمة:</p>
          <ul>
            <li><strong>شركات الشحن:</strong> نشارك اسم العميل وعنوانه ورقم هاتفه مع شركات التوصيل لإيصال الطلبات.</li>
            <li><strong>بوابات الدفع:</strong> تتم معالجة بيانات الدفع عبر مزودين معتمدين وآمنين (مثل Stripe أو شركات الدفع المحلية).</li>
            <li><strong>الجهات القانونية:</strong> قد نفصح عن المعلومات إذا كان ذلك مطلوباً بموجب القوانين النافذة في الجمهورية اليمنية.</li>
          </ul>
        </section>

        <section id="security" className={styles.section}>
          <h2>أمن المعلومات</h2>
          <p>
            نحن نطبق معايير أمنية عالية لحماية بياناتكم من الوصول غير المصرح به أو التغيير أو الإفصاح. 
            يتم تشفير جميع البيانات الحساسة (مثل معلومات الدفع) باستخدام تقنيات (SSL/TLS). ومع ذلك، يرجى تذكر أنه لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة 100%.
          </p>
        </section>

        <section id="rights" className={styles.section}>
          <h2>حقوق المستخدم</h2>
          <p>بموجب هذه السياسة، يحق لكم:</p>
          <ul>
            <li>الوصول إلى بياناتكم الشخصية التي نحتفظ بها.</li>
            <li>تصحيح أي معلومات غير دقيقة أو تحديثها.</li>
            <li>طلب حذف حسابكم وبياناتكم (مع مراعاة البيانات التي يجب الاحتفاظ بها لأغراض قانونية أو مالية).</li>
          </ul>
        </section>

        <section id="cookies" className={styles.section}>
          <h2>ملفات تعريف الارتباط (Cookies)</h2>
          <p>
            نستخدم ملفات تعريف الارتباط لتحسين تجربتكم على المنصة وتذكر تفضيلاتكم. 
            يمكنكم التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحكم، ولكن قد يؤثر ذلك على بعض وظائف المنصة.
          </p>
        </section>

        <section className={styles.section}>
          <h2>التواصل معنا</h2>
          <p>إذا كان لديكم أي استفسار حول سياسة الخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني: support@buyers.com</p>
        </section>
      </main>
    </div>
  );
}
