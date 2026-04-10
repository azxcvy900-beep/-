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
      <Header storeName="بايرز / Buyers" />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.bgGrid} />
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={styles.heroContent}
          >
            <div className={styles.badge}>
              <Zap size={14} />
              <span>أول منصة يمنية بنظام SaaS العالمي</span>
            </div>
            <h1 className={styles.title}>
              ابنِ إمبراطوريتك التجارية <br />
              <span>بسهولة واحترافية</span>
            </div>
            <p className={styles.subtitle}>
              منصة "بايرز" تمنحك متجراً متكاملاً، لوحة تحكم ذكية، ونظام طلبات مباشر عبر واتساب. ابدأ اليوم وحوّل زوارك إلى عملاء دائمين.
            </p>
            <div className={styles.ctas}>
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtn}>
                ابدأ تجربتك المجانية <ArrowRight size={20} />
              </Link>
              <Link href={`/${locale}/store/demo`} className={styles.secondaryBtn}>
                شاهد متجراً تجريبياً
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Stats Preview */}
        <section className={styles.stats}>
          <div className={styles.statCard}>
            <h3>+500</h3>
            <p>متجر مشترك</p>
          </div>
          <div className={styles.statLine} />
          <div className={styles.statCard}>
            <h3>+10k</h3>
            <p>طلب شهري</p>
          </div>
          <div className={styles.statLine} />
          <div className={styles.statCard}>
            <h3>99.9%</h3>
            <p>وقت التشغيل</p>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.featuresHeader}>
            <span className={styles.preTitle}>لماذا بايرز؟</span>
            <h2>كل ما تحتاجه لإدارة تجارتك</h2>
          </div>

          <div className={styles.featureGrid}>
            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><LayoutDashboard /></div>
              <h3>لوحة تحكم رادارية</h3>
              <p>شاهد نمو مبيعاتك، أداء منتجاتك، وتفاعل عملائك في الوقت الفعلي ومن مكان واحد.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><MessageCircle /></div>
              <h3>طلبات واتساب فورية</h3>
              <p>تصلك الطلبات بكامل تفاصيلها مباشرة إلى واتساب، مما يسهل عليك خدمة العملاء.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><Globe /></div>
              <h3>رابط خاص بك</h3>
              <p>احصل على رابط متجر خاص (slug) يعكس هويتك، وسهّل على عملائك العثور عليك.</p>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><ShieldCheck /></div>
              <h3>أمان وموثوقية</h3>
              <p>بيانات متجرك وعملائك في أمان تام مع أنظمة حماية متقدمة ودعم فني على مدار الساعة.</p>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.finalCta}>
          <div className={styles.ctaCard}>
            <h2>هل أنت مستعد لإطلاق متجرك؟</h2>
            <p>انضم إلى مئات التجار في اليمن وبروز علامتك التجارية اليوم.</p>
            <Link href={`/${locale}/admin/login`} className={styles.primaryBtnLarge}>
              سجل الآن وابدأ البيع <Rocket size={20} />
            </Link>
          </div>
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
