'use client';

import React from 'react';
import Image from "next/image";

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
          
          <div className={styles.heroContent}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={styles.badge}
            >
              <Zap size={16} />
              <span>أقوى منصة سحابية للتجارة في اليمن</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={styles.title}
            >
              امتلك متجراً احترافياً <br/>
              <span>وضاعف مبيعاتك اليوم</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={styles.subtitle}
            >
              حوّل مشروعك إلى علامة تجارية عالمية. "بايرز" توفر لك أدوات متكاملة لإدارة المنتجات، الطلبات، والعملاء بضغطة زر.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={styles.ctas}
            >
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtn}>
                سجل وابدأ الآن <ArrowRight size={22} />
              </Link>
              <Link href={`/${locale}/store/demo`} className={styles.secondaryBtn}>
                <Globe size={20} /> تصفح نسخة ديمو
              </Link>
            </motion.div>

            {/* Premium Hero Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className={styles.heroVisual}
            >
              <div className={styles.visualGlow} />
              <Image 
                src="/premium_hero_dashboard_v1_1776535565323.png" 
                alt="Buyers Premium Dashboard Illustration" 
                width={1000} 
                height={600} 
                className={styles.dashboardPreview}
                priority
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className={styles.heroProof}
            >
              <div className={styles.avatars}>
                <div className={styles.avatar} style={{ background: '#7c3aed', color: 'white' }}>A</div>
                <div className={styles.avatar} style={{ background: '#10b981', color: 'white' }}>M</div>
                <div className={styles.avatar} style={{ background: '#f59e0b', color: 'white' }}>S</div>
              </div>
              <p>انضمت إلينا أكثر من <strong>500+</strong> علامة تجارية يمنية ناشئة</p>
            </motion.div>
          </div>
        </section>

        {/* The Comparison Section */}
        <section className={styles.comparison}>
          <div className={styles.sectionHeader}>
            <span className={styles.preTitle}>لماذا تختار بايرز؟</span>
            <h2>ارتقِ بتجارتك من العشوائية إلى العالمية</h2>
          </div>
          
          <div className={styles.comparisonGrid}>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`${styles.compareCard} ${styles.compareBad}`}
            >
              <div className={styles.compareHeader}>
                <XCircle size={32} />
                <h3>البيع التقليدي (يدوي)</h3>
              </div>
              <ul>
                <li><XCircle size={18} /> طلبات مبعثرة بين واتساب وتليجرام</li>
                <li><XCircle size={18} /> تأخر في تحديث الأسعار والمخزون</li>
                <li><XCircle size={18} /> لا توجد تقارير أداء أو بيانات عملاء</li>
                <li><XCircle size={18} /> ثقة ضعيفة من العملاء الجدد</li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`${styles.compareCard} ${styles.compareGood}`}
            >
              <div className={styles.compareBadge}>المستقبل هنا</div>
              <div className={styles.compareHeader}>
                <CheckCircle2 size={32} />
                <h3>التحول الرقمي مع <span>بايرز</span></h3>
              </div>
              <ul>
                <li><CheckCircle2 size={18} /> نظام استلام طلبات آلي 24/7</li>
                <li><CheckCircle2 size={18} /> ربط فوري بالمخزون وتحديث الأسعار</li>
                <li><CheckCircle2 size={18} /> ذكاء أعمال وتقارير ربح متعمقة</li>
                <li><CheckCircle2 size={18} /> واجهة احترافية تضاعف مبيعاتك</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Benefits/Features In Bento Grid */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <span className={styles.preTitle}>المميزات</span>
            <h2>ترسانة أدوات متكاملة بين يديك</h2>
          </div>

          <div className={styles.featureGrid}>
            <motion.div whileHover={{ y: -5 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><Rocket /></div>
              <h3>إطلاق في دقائق</h3>
              <p>منظومة جاهزة للعمل فوراً. لا حاجة لمبرمجين أو خبرة تقنية معقدة.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><ShieldCheck /></div>
              <h3>حوكمة البيانات</h3>
              <p>تشفير كامل لبيانات عملائك وحماية لطلباتك عبر خوادم سحابية مؤمنة.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><LayoutDashboard /></div>
              <h3>إدارة متعددة الأجهزة</h3>
              <p>تحكم في متجرك بمرونة فائقة من هاتفك أو حاسوبك الشخصي من أي مكان.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><TrendingUp /></div>
              <h3>نمو مدفوع بالبيانات</h3>
              <p>حلل سلوك المشترين واستخدم الكوبونات الذكية لزيادة معدل التحويل.</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><Globe /></div>
              <h3>تعدد اللغات والعملات</h3>
              <p>استهدف السوق المحلي والعالمي بدعم كامل للريال اليمني، السعودي، والدولار.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className={styles.featureCard}>
              <div className={styles.featureIcon}><MessageCircle /></div>
              <h3>تواصل ذكي</h3>
              <p>تنبيهات فورية عبر واتساب للعميل وللتاجر عند كل عملية شراء جديدة.</p>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }} 
            className={styles.ctaCard}
          >
            <div className={styles.ctaContent}>
              <h2>ابدأ رحلتك نحو الريادة اليوم</h2>
              <p>كن واحداً من رواد الأعمال الذين غيروا قواعد اللعبة في السوق اليمني.</p>
              <Link href={`/${locale}/admin/login`} className={styles.primaryBtn}>
                اشترك الآن مجاناً <ArrowRight size={22} />
              </Link>
            </div>
            <div className={styles.ctaGraphic}>
              <Store size={280} strokeWidth={1} />
            </div>
          </motion.div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>بايرز</span>
          <p>ريادة التجارة الإلكترونية في اليمن والعالم العربي</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href={`/${locale}/admin/login`}>بوابة التجار</Link>
          <Link href={`/${locale}/manager/login`}>الإدارة العامة</Link>
          <Link href="#">الدعم الفني</Link>
          <Link href={`/${locale}/store/demo`}>نسخة تجريبية</Link>
        </div>
        <div className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Buyers. All Rights Reserved. Crafted with Passion for Yemeni Merchants.
        </div>
      </footer>
    </div>
  );
}

