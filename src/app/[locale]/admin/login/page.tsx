'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Store, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success! Redirect to dashboard
      router.push(`/${locale}/admin/dashboard`);
    } catch (err: any) {
      console.error("Login error:", err);
      // Localized error messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('بيانات الدخول غير صحيحة.');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة لاحقاً.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={styles.loginCard}
      >
        <div className={styles.logoArea}>
          <div className={styles.logo}>
            بايرز <span>آدمن</span>
          </div>
        </div>

        <h1 className={styles.title}>{t('loginTitle')}</h1>
        <p className={styles.subtitle}>أهلاً بك مجدداً! يرجى تسجيل الدخول لإدارة متجرك.</p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={styles.errorMsg}
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">{t('email')}</label>
            <div className={styles.inputWrapper}>
              <Mail size={20} />
              <input 
                id="email"
                type="email" 
                className={styles.input}
                placeholder="admin@buyers.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">{t('password')}</label>
            <div className={styles.inputWrapper}>
              <Lock size={20} />
              <input 
                id="password"
                type="password" 
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <LogIn size={20} />
                {t('loginBtn')}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
