'use client';

import React from 'react';
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  MessageCircle, 
  Store, 
  ArrowRight,
  ChevronDown,
  Globe,
  LayoutDashboard
} from "lucide-react";
import Header from "@/components/shared/Header/Header";
import styles from "./page.module.css";

export default function Home() {
  const t = useTranslations("Landing");
  const locale = useLocale();

  return (
    <div className={styles.container}>
      <Header storeName="بايرز / Buyers" isLanding={true} />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroGradient} />
          <div className={styles.bgGrid} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={styles.heroContent}
          >
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={styles.badge}
            >
              <Zap size={14} className={styles.pulse} />
              <span>الجيل الجديد من التجارة الإلكترونية في اليمن</span>
            </motion.div>
            <h1 className={styles.title}>
              حوّل شغفك إلى <span>أرباح حقيقية </span> <br />
              أنشئ متجرك في دقائق
            </h1>
            <p className={styles.subtitle}>
              لا تحتاج لخبرة برمجية. منصة "بايرز" توفر لك كل الأدوات اللازمة للبيع، الإدارة، والنمو. ابدأ الآن وانضم لنخبة التجار المبدعين.
            </p>
            <div className={styles.ctas}>
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtn}>
                ابدأ رحلتك المجانية <ArrowRight size={20} />
              </Link>
              <Link href={`/${locale}/store/demo`} className={styles.secondaryBtn}>
                <Globe size={18} /> شاهد متجراً حقيقياً
              </Link>
            </div>
          </motion.div>
        </section>

        {/* How It Works - New Section */}
        <section className={styles.steps}>
          <div className={styles.sectionHeader}>
            <span className={styles.preTitle}>رحلتك تبدأ هنا</span>
            <h2>ثلاث خطوات لتكون في القمة</h2>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3>أنشئ حسابك</h3>
              <p>سجل في ثوانٍ واختر رابط متجرك الفريد الذي يعبر عن اسم علامتك التجارية.</p>
            </div>
            <div className={styles.stepArrow}><ArrowRight /></div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3>أضف منتجاتك</h3>
              <p>ارفع صور منتجاتك بضغطة زر، حدد الأسعار، وخصص مظهر متجرك بما يناسب ذوقك.</p>
            </div>
            <div className={styles.stepArrow}><ArrowRight /></div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h3>ابدأ بالبيع</h3>
              <p>استقبل الطلبات مباشرة على واتساب، وقم بإدارة مبيعاتك من لوحة تحكم ذكية وشاملة.</p>
            </div>
          </div>
        </section>

        {/* Stats Preview */}
        <section className={styles.stats}>
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} className={styles.statCard}>
            <h3>+500</h3>
            <p>تاجر يمني يثق بنا</p>
          </motion.div>
          <div className={styles.statLine} />
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.1 }} className={styles.statCard}>
            <h3>+10k</h3>
            <p>طلب ناجح شهرياً</p>
          </motion.div>
          <div className={styles.statLine} />
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.2 }} className={styles.statCard}>
            <h3>100%</h3>
            <p>دعم فني متواصل</p>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.featuresHeader}>
            <span className={styles.preTitle}>مميزات لا تضاهى</span>
            <h2>لماذا يفضل التجار "بايرز"؟</h2>
          </div>

          <div className={styles.featureGrid}>
            <motion.div whileHover={{ y: -12, scale: 1.02 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><Rocket /></div>
              <h3>سرعة وأداء خارق</h3>
              <p>متجرك يفتح في أقل من ثانية، مما يضمن عدم ضياع أي عميل وبقاءهم أطول فترة ممكنة.</p>
            </motion.div>

            <motion.div whileHover={{ y: -12, scale: 1.02 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><MessageCircle /></div>
              <h3>تكامل تام مع واتساب</h3>
              <p>إدارة الطلبات عبر واتساب تزيد من ثقة العملاء وتجعل التواصل أسرع من أي وقت مضى.</p>
            </motion.div>

            <motion.div whileHover={{ y: -12, scale: 1.02 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><LayoutDashboard /></div>
              <h3>ذكاء في الإدارة</h3>
              <p>تقارير يومية عن الأرباح، الزوار، والمنتجات الأكثر طلباً لمساعدتك في اتخاذ قراراتك.</p>
            </motion.div>

            <motion.div whileHover={{ y: -12, scale: 1.02 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><Zap /></div>
              <h3>سهولة الاستخدام</h3>
              <p>صممنا واجهة التحكم لتكون بسيطة حتى للمبتدئين، لا حاجة لمهارات تقنية معقدة.</p>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.finalCta}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className={styles.ctaCard}>
            <h2>كن جزءاً من مستقبل التجارة في اليمن</h2>
            <p>انضم اليوم واستفد من كافة المميزات مجاناً لفترة محدودة.</p>
            <Link href={`/${locale}/admin/login`} className={styles.primaryBtnLarge}>
              أسس متجرك الآن <ArrowRight size={20} />
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>بايرز &copy; {new Date().getFullYear()}</div>
        <div className={styles.footerLinks}>
          <Link href={`/${locale}/manager/login`}>إدارة المنصة</Link>
          <span>•</span>
          <Link href="#">الشروط والأحكام</Link>
        </div>
      </footer>
    </div>
  );
}
