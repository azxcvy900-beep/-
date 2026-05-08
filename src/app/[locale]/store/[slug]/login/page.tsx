'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useCustomerSessionStore } from '@/lib/customer-session-store';
import { toast } from 'sonner';
import Link from 'next/link';
import styles from './login.module.css';

export default function CustomerLoginPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const { slug } = useParams();
  const router = useRouter();
  const login = useCustomerSessionStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('تم تسجيل الدخول بنجاح');
        router.push(`/${locale}/store/${slug}`);
      } else {
        toast.error('خطأ في البريد الإلكتروني أو كلمة المرور');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <motion.div 
        className={styles.loginCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <Link href={`/${locale}/store/${slug}`} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <h1>تسجيل الدخول</h1>
          <p>أهلاً بك مجدداً في متجرنا</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>البريد الإلكتروني</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.icon} size={18} />
              <input 
                type="email" 
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>كلمة المرور</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.icon} size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.spin} size={20} /> : <LogIn size={20} />}
            تسجيل الدخول
          </button>
        </form>

        <div className={styles.footer}>
          <span>ليس لديك حساب؟</span>
          <Link href={`/${locale}/store/${slug}/register`} className={styles.registerLink}>
            إنشاء حساب جديد
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
