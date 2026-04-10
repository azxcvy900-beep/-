'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert, User, Lock, LogIn, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useSessionStore } from '@/lib/session-store';
import styles from './login.module.css';

export default function ManagerLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, role, loginAsAdmin } = useSessionStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in as admin, redirect to manager
  useEffect(() => {
    if (isLoggedIn && role === 'admin') {
      router.replace(`/${locale}/manager`);
    }
  }, [isLoggedIn, role, router, locale]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 800));

    const success = loginAsAdmin(username, password);
    if (success) {
      router.push(`/${locale}/manager`);
    } else {
      setError('بيانات الدخول غير صحيحة. تأكد من صلاحيات المدير.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      {/* Animated grid background */}
      <div className={styles.gridBg} />
      
      {/* Glow spots */}
      <div className={styles.glowSpot} style={{ top: '15%', right: '20%' }} />
      <div className={styles.glowSpot2} style={{ bottom: '20%', left: '15%' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={styles.loginCard}
      >
        <div className={styles.logoArea}>
          <motion.div 
            className={styles.logoIcon}
            animate={{ 
              boxShadow: [
                '0 0 30px rgba(16, 185, 129, 0.3)',
                '0 0 50px rgba(16, 185, 129, 0.5)',
                '0 0 30px rgba(16, 185, 129, 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShieldAlert size={40} />
          </motion.div>
          <div className={styles.logo}>
            بايرز <span>بروتوكول</span>
          </div>
          <div className={styles.badge}>
            <Sparkles size={12} />
            <span>الإدارة العليا — Super Admin</span>
          </div>
        </div>

        <h1 className={styles.title}>دخول المدير العام</h1>
        <p className={styles.subtitle}>هذه البوابة مخصصة لمدير المنصة فقط. يرجى إدخال بيانات الاعتماد.</p>

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
            <label htmlFor="mgr-username">اسم المستخدم</label>
            <div className={styles.inputWrapper}>
              <User size={20} />
              <input 
                id="mgr-username"
                type="text" 
                className={styles.input}
                placeholder="أدخل اسم المدير"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="mgr-password">كلمة المرور</label>
            <div className={styles.inputWrapper}>
              <Lock size={20} />
              <input 
                id="mgr-password"
                type="password" 
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
                <ShieldAlert size={20} />
                الدخول إلى الإدارة
              </>
            )}
          </button>

          <div className={styles.divider}>
            <span>أو</span>
          </div>

          <button 
            type="button"
            className={styles.merchantBtn}
            onClick={() => router.push(`/${locale}/admin/login`)}
          >
            <ArrowRight size={18} />
            العودة لدخول التجار
          </button>
        </form>
      </motion.div>
    </div>
  );
}
