'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Globe, 
  Send, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  HeadphonesIcon,
  Store 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoreInfo, StoreInfo } from '@/lib/api';
import styles from './Footer.module.css';

const Footer = () => {
  const t = useTranslations('Footer');
  const locale = useLocale();
  const pathname = usePathname();
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  const storeSlug = pathname.split('/').find(part => 
    !['ar', 'en', 'orders', 'track', 'wishlist', 'cart', 'checkout', 'order-success', ''].includes(part)
  );

  useEffect(() => {
    if (storeSlug) {
      getStoreInfo(storeSlug).then(setStoreInfo);
    } else {
      setStoreInfo(null);
    }
  }, [storeSlug]);

  // Hide global footer on landing page to avoid duplication with specialized marketing footer
  const isLandingPage = pathname === `/${locale}` || pathname === `/${locale}/`;
  
  if (isLandingPage) return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.topSection}>
        <div className={styles.container}>
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><Truck size={24} /></div>
              <div className={styles.featureInfo}>
                <h4>{t('fastDelivery')}</h4>
                <p>{t('fastDeliveryDesc')}</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><ShieldCheck size={24} /></div>
              <div className={styles.featureInfo}>
                <h4>{t('securePayment')}</h4>
                <p>{t('securePaymentDesc')}</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><RotateCcw size={24} /></div>
              <div className={styles.featureInfo}>
                <h4>{t('easyReturn')}</h4>
                <p>{t('easyReturnDesc')}</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><HeadphonesIcon size={24} /></div>
              <div className={styles.featureInfo}>
                <h4>{t('support24')}</h4>
                <p>{t('support24Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainSection}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.brandCol}>
              <Link href={`/${locale}`} className={styles.logo}>
                {storeInfo ? (
                  <div className={styles.storeBranding}>
                    {storeInfo.logo ? (
                      <img 
                        src={storeInfo.logo} 
                        alt={storeInfo.name} 
                        style={{ height: '32px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} 
                      />
                    ) : (
                      <Store size={22} className={styles.storeIcon} />
                    )}
                    <span>{storeInfo.name}</span>
                  </div>
                ) : (
                  <>بايرز<span>.</span></>
                )}
              </Link>
              <p className={styles.description}>
                {t('brandDescription')}
              </p>
            <div className={styles.socials}>
                <motion.a whileHover={{ y: -3 }} href="#"><Globe size={20} /></motion.a>
                <motion.a whileHover={{ y: -3 }} href="#"><Send size={20} /></motion.a>
                <motion.a whileHover={{ y: -3 }} href="#"><MessageCircle size={20} /></motion.a>
            </div>
            </div>

            <div className={styles.linksCol}>
              <h3>{t('quickLinks')}</h3>
              <ul>
                <li><Link href={`/${locale}`}>{t('home')}</Link></li>
                <li><Link href={`/${locale}/orders`}>{t('myOrders')}</Link></li>
                <li><Link href={`/${locale}/track`}>{t('trackOrder')}</Link></li>
                <li><Link href={`/${locale}/admin`} className={styles.adminLink}>{t('merchantLogin')}</Link></li>
                <li><Link href={`/${locale}/manager`} className={styles.managerLink} style={{ color: 'var(--primary)', fontWeight: '600' }}>{t('managerLogin')}</Link></li>
              </ul>
            </div>

            <div className={styles.linksCol}>
              <h3>{t('privacyPolicies')}</h3>
              <ul>
                <li><Link href="#">{t('terms')}</Link></li>
                <li><Link href="#">{t('privacy')}</Link></li>
                <li><Link href="#">{t('refundPolicy')}</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.container}>
          <p>© {new Date().getFullYear()} {t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
