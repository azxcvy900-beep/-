'use client';

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  TrendingUp,
  ChevronRight
} from "lucide-react";
import Header from "@/components/shared/Header/Header";
import AnimatedStats from "@/components/landing/AnimatedStats/AnimatedStats";
import FloatingCTA from "@/components/landing/FloatingCTA/FloatingCTA";
import styles from "./page.module.css";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { getPlatformSettings, PlatformSettings } from "@/lib/api";

export default function Home() {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const scrollRef = useRef(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  useEffect(() => {
    getPlatformSettings().then(setPlatformSettings);
  }, []);

  // Simple carousel logic for multiple hero media items
  useEffect(() => {
    if (platformSettings?.heroMedia && platformSettings.heroMedia.length > 1) {
      const interval = setInterval(() => {
        setActiveMediaIndex(prev => (prev + 1) % platformSettings.heroMedia!.length);
      }, 5000); // Switch every 5 seconds
      return () => clearInterval(interval);
    }
  }, [platformSettings?.heroMedia]);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const heroMedia = platformSettings?.heroMedia || [
    { type: 'image', url: '/premium_hero_dashboard_v1_1776535565323.png' }
  ];

  return (
    <div className={styles.container} ref={scrollRef}>
      {/* Dynamic Background Blobs */}
      <div className={styles.blobWrapper}>
        <div className={styles.blob} />
        <div className={`${styles.blob} ${styles.blobSecondary}`} />
        <div className={`${styles.blob} ${styles.blobAccent}`} />
      </div>

      <Header storeName="بايرز / Buyers" isLanding={true} />
      
      <main className={styles.main}>
        {/* Premium Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroGradient} />
          <div className={styles.bgGrid} />
          
          <div className={styles.heroContent}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={styles.badge}
            >
              <Zap size={14} />
              <span>{t("badge")}</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={styles.title}
            >
              {t("title_main")} <br/>
              <span>{t("title_sub")}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={styles.subtitle}
            >
              {t("description")}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className={styles.ctas}
            >
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtn}>
                {t("cta_start")} <ArrowRight size={20} />
              </Link>
              <Link href={`/${locale}/store/demo`} className={styles.secondaryBtn}>
                <Globe size={18} /> {t("cta_demo")}
              </Link>
            </motion.div>

            {/* Premium Hero Visual */}
            <motion.div 
              initial={{ opacity: 0, y: 60, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={styles.heroVisual}
            >
              <div className={styles.visualGlow} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMediaIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.8 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  {heroMedia[activeMediaIndex]?.type === 'image' ? (
                    <Image 
                      src={heroMedia[activeMediaIndex].url || '/premium_hero_dashboard_v1_1776535565323.png'} 
                      alt="Buyers Premium Dashboard Illustration" 
                      width={1200} 
                      height={700} 
                      className={styles.dashboardPreview}
                      priority
                    />
                  ) : (
                    <div className={styles.videoWrapper} style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', width: '100%', height: '100%' }}>
                      <video 
                        src={heroMedia[activeMediaIndex].url} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className={styles.dashboardPreview}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className={styles.heroProof}
            >
              <div className={styles.avatars}>
                <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}>A</div>
                <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>M</div>
                <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>S</div>
              </div>
              <p>{t("hero_proof")}</p>
            </motion.div>
          </div>
        </section>

        <AnimatedStats t={t} />

        {/* The Comparison Section */}
        <section className={styles.comparison}>
          <div className={styles.sectionHeader}>
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={styles.preTitle}
            >
              {t("comparison_pre")}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {t("comparison_title")}
            </motion.h2>
          </div>
          
          <div className={styles.comparisonGrid}>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`${styles.compareCard} ${styles.compareBad}`}
            >
              <div className={styles.compareHeader}>
                <XCircle size={28} color="#ef4444" />
                <h3>{t("compare_bad_title")}</h3>
              </div>
              <ul>
                {t.raw("compare_bad_items").map((item: string, i: number) => (
                  <li key={i}><XCircle size={16} color="#fecaca" /> {item}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`${styles.compareCard} ${styles.compareGood}`}
            >
              <div className={styles.compareBadge}>{t("compare_good_badge")}</div>
              <div className={styles.compareHeader}>
                <CheckCircle2 size={28} color="#10b981" />
                <h3>{t("compare_good_title")} <span>بايرز</span></h3>
              </div>
              <ul>
                {t.raw("compare_good_items").map((item: string, i: number) => (
                  <li key={i}><CheckCircle2 size={16} color="#a7f3d0" /> {item}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Benefits/Features In Bento Grid */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <span className={styles.preTitle}>{t("features_pre")}</span>
            <h2>{t("features_title")}</h2>
          </div>

          <div className={styles.featureGrid}>
            {[
              { icon: <Rocket />, title: t("f1_title"), desc: t("f1_desc") },
              { icon: <ShieldCheck />, title: t("f2_title"), desc: t("f2_desc") },
              { icon: <LayoutDashboard />, title: t("f3_title"), desc: t("f3_desc") },
              { icon: <TrendingUp />, title: t("f4_title"), desc: t("f4_desc") },
              { icon: <Globe />, title: t("f5_title"), desc: t("f5_desc") },
              { icon: <MessageCircle />, title: t("f6_title"), desc: t("f6_desc") }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={styles.featureCard}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6 }}
            className={styles.ctaCard}
          >
            <div className={styles.ctaContent}>
              <h2>{t("final_cta_title")}</h2>
              <p>{t("final_cta_desc")}</p>
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtn}>
                {t("final_cta_btn")} <ChevronRight size={22} />
              </Link>
            </div>
            <div className={styles.ctaGraphic}>
              <Store size={320} strokeWidth={0.5} />
            </div>
          </motion.div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>بايرز</span>
          <p>{locale === 'ar' ? 'ريادة التجارة الإلكترونية في اليمن والعالم العربي' : 'Leading E-commerce in Yemen & Arab World'}</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href={`/${locale}/admin/login`}>{locale === 'ar' ? 'بوابة التجار' : 'Merchant Portal'}</Link>
          <Link href={`/${locale}/manager/login`}>{locale === 'ar' ? 'الإدارة العامة' : 'Central Admin'}</Link>
          <Link href="#">{locale === 'ar' ? 'الدعم الفني' : 'Support'}</Link>
          <Link href={`/${locale}/store/demo`}>{locale === 'ar' ? 'نسخة تجريبية' : 'Demo Store'}</Link>
        </div>
        <div className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Buyers. All Rights Reserved. Crafted for Yemeni Excellence.
        </div>
      </footer>
      <FloatingCTA />
    </div>
  );
}

