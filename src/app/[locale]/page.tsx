import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import Header from "@/components/shared/Header/Header";
import styles from "./page.module.css";

export default function Home() {
  const t = useTranslations("Landing");
  const locale = useLocale();

  return (
    <>
      <Header storeName="بايرز / Buyers" />
      <div className={styles.page}>
        <main className={styles.main}>
          <motion.div 
            className={styles.hero}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
            <div className={styles.ctas}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={`/${locale}/store/demo`} className={styles.primary}>
                  {t('cta')}
                </Link>
              </motion.div>
            </div>
          </motion.div>
          
          <div className={styles.features}>
            <h2>{t('features')}</h2>
            <p>{t('sub_features')}</p>
          </div>
        </main>
      </div>
    </>
  );
}
