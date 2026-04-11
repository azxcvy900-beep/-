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
  Globe,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  TrendingUp
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
        {/* Premium Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroGradient} />
          <div className={styles.bgGrid} />
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={styles.heroContent}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={styles.badge}
            >
              <Zap size={16} className={styles.pulse} />
              <span>أقوى منصة سحابية في اليمن</span>
            </motion.div>
            
            <h1 className={styles.title}>
              امتلك متجراً احترافياً <br/>
              <span>وضاعف مبيعاتك اليوم</span>
            </h1>
            
            <p className={styles.subtitle}>
              توقف عن تلقي الطلبات بعشوائية. "بايرز" توفر لك نظاماً الكترونياً متكاملاً لإدارة متجرك، عرض منتجاتك، وخدمة عملائك باحترافية تبني الثقة.
            </p>
            
            <div className={styles.ctas}>
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtn}>
                سجل وابدأ الآن <ArrowRight size={22} />
              </Link>
              <Link href={`/${locale}/store/demo`} className={styles.secondaryBtn}>
                <Globe size={20} /> تصفح متجراً حقيقياً
              </Link>
            </div>
            
            <div className={styles.heroProof}>
              <div className={styles.avatars}>
                <div className={styles.avatar}>T</div>
                <div className={styles.avatar}>M</div>
                <div className={styles.avatar}>S</div>
              </div>
              <p>انضم لأكثر من <strong>500+</strong> تاجر ذكي</p>
            </div>
          </motion.div>
        </section>

        {/* The "Why Us" Comparison Section (Crucial for Conversion) */}
        <section className={styles.comparison}>
          <div className={styles.sectionHeader}>
            <span className={styles.preTitle}>لماذا تختار منصتنا؟</span>
            <h2>الفرق بين العمل العشوائي والعمل الاحترافي</h2>
          </div>
          
          <div className={styles.comparisonGrid}>
            <motion.div whileHover={{ y: -5 }} className={`${styles.compareCard} ${styles.compareBad}`}>
              <div className={styles.compareHeader}>
                <XCircle size={32} color="#ef4444" />
                <h3>البيع التقليدي (انستجرام/واتساب فقط)</h3>
              </div>
              <ul>
                <li><XCircle size={18} /> ضياع تفاصيل الطلبات وسط الرسائل</li>
                <li><XCircle size={18} /> العميل ينتظر طويلاً ليعرف السعر والتوفر</li>
                <li><XCircle size={18} /> صعوبة حساب الأرباح وإدارة المخزون</li>
                <li><XCircle size={18} /> عدم وجود واجهة تعكس احترافيتك</li>
              </ul>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className={`${styles.compareCard} ${styles.compareGood}`}>
              <div className={styles.compareBadge}>الخيار الأمثل</div>
              <div className={styles.compareHeader}>
                <CheckCircle2 size={32} color="#10b981" />
                <h3>البيع عبر منصة <span>بايرز</span></h3>
              </div>
              <ul>
                <li><CheckCircle2 size={18} /> نظام آلي يستقبل الطلبات بكفاءة عالية</li>
                <li><CheckCircle2 size={18} /> شراء مباشر ومريح للعميل من متجرك المخصص</li>
                <li><CheckCircle2 size={18} /> تقارير أرباح وإدارة مخزون بضغطة زر</li>
                <li><CheckCircle2 size={18} /> واجهة عالمية تبني ثقة مطلقة مع المشترين</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Benefits/Features */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <span className={styles.preTitle}>كل ما تحتاجه للنجاح</span>
            <h2>صُممت خصيصاً لتنمية تجارتك</h2>
          </div>

          <div className={styles.featureGrid}>
            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><Rocket /></div>
              <h3>إطلاق فوري وسريع</h3>
              <p>لن تنتظر أياماً لبرمجة موقعك، فقط سجل وجهز منتجاتك وابدأ باستقبال عملائك خلال دقائق.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><ShieldCheck /></div>
              <h3>حماية وثقة للعميل</h3>
              <p>نظام إتمام طلبات آمن مع إثباتات الدفع والحوالات لضمان حقوقك وحقوق المشتري بالكامل.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><LayoutDashboard /></div>
              <h3>لوحة تحكم ذكية</h3>
              <p>تتبع كل زيارة، راقب المبيعات، وعدل الأسعار بسهولة تامة من جوالك أو حاسوبك شخصياً.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><TrendingUp /></div>
              <h3>أدوات تسويقية متقدمة</h3>
              <p>أكواد خصم لعملائك، تقسيم الفئات، ودعم كامل للغات يتيح لك استهداف شرائح مختلفة بفعالية.</p>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2>لا تترك أرباحك على الطاولة!</h2>
              <p>المئات من التجار اليمنيّين نقلوا أعمالهم إلى مستوى آخر عبر بايرز. ماذا تنتظر؟</p>
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtnLarge}>
                اشترك وافتح متجرك مجاناً <ArrowRight size={22} />
              </Link>
            </div>
            <div className={styles.ctaGraphic}>
              <Store size={150} opacity={0.1} />
            </div>
          </motion.div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>بايرز</span>
          <p>منصة التجارة الإلكترونية الأكثر تطوراً في اليمن</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href={`/${locale}/manager/login`}>بوابة الإدارة</Link>
          <span>•</span>
          <Link href="#">الشروط والأحكام</Link>
          <span>•</span>
          <Link href={`/${locale}/store/demo`}>النماذج التجريبية</Link>
        </div>
        <div className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Buyers Platform. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
