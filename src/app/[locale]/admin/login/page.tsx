'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  LogIn, 
  Store, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  UserPlus, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useSessionStore } from '@/lib/session-store';
import { registerMerchant, checkUsernameAvailability } from '@/lib/api';
import styles from './login.module.css';

type AuthMode = 'login' | 'register';

export default function AdminLoginPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, role, loginAsMerchant } = useSessionStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If already logged in as merchant, redirect to dashboard or setup
  useEffect(() => {
    if (isLoggedIn && role === 'merchant') {
       // Check if storeSlug exists, if not, they might need setup (logic handled via routing/setup check)
       router.replace(`/${locale}/admin/dashboard`);
    }
  }, [isLoggedIn, role, router, locale]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const success = await loginAsMerchant(username, password);
      if (success) {
        setSuccess('تم تسجيل الدخول بنجاح! جاري التوجيه...');
        setTimeout(() => router.push(`/${locale}/admin/dashboard`), 800);
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create merchant account
      await registerMerchant({ username, password });
      
      // 2. Auto login
      await loginAsMerchant(username, password);
      
      setSuccess('تم إنشاء الحساب بنجاح! لنبدأ بتجهيز متجرك...');
      
      // 3. Redirect to Setup Wizard
      setTimeout(() => router.push(`/${locale}/admin/setup`), 1500);
    } catch (err: any) {
      if (err.message === 'username_taken') {
        setError('اسم المستخدم هذا محجوز بالفعل. اختر اسماً آخر.');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.bgParticles}>
        <div className={styles.particle} style={{ top: '10%', left: '15%', animationDelay: '0s' }} />
        <div className={styles.particle} style={{ top: '60%', left: '80%', animationDelay: '1.5s' }} />
        <div className={styles.particle} style={{ top: '30%', left: '60%', animationDelay: '3s' }} />
        <div className={styles.particle} style={{ top: '80%', left: '25%', animationDelay: '0.8s' }} />
        <div className={styles.particle} style={{ top: '45%', left: '40%', animationDelay: '2.2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={styles.loginCard}
      >
        <div className={styles.logoArea}>
          <motion.div 
            className={styles.logoIcon}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Store size={40} />
          </motion.div>
          <div className={styles.logo}>
            بايرز <span>تجار</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            <LogIn size={18} />
            تسجيل دخول
          </button>
          <button 
            className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          >
            <UserPlus size={18} />
            إنشاء متجر جديد
          </button>
          <motion.div 
            layoutId="tab-underline"
            className={styles.tabUnderline}
            animate={{ x: mode === 'login' ? '0%' : '100%' }}
          />
        </div>

        <h1 className={styles.title}>
          {mode === 'login' ? 'مرحباً بعودتك' : 'انضم لأسرة بايرز'}
        </h1>
        <p className={styles.subtitle}>
          {mode === 'login' 
            ? 'أدخل بياناتك للوصول إلى لوحة التحكم' 
            : 'ابدأ رحلة نجاحك وأنشئ متجرك الإلكتروني في دقائق'}
        </p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.errorMsg}
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.successMsg}
            >
              <CheckCircle2 size={18} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">اسم المستخدم (بالإنجليزي)</label>
            <div className={styles.inputWrapper}>
              <User size={20} />
              <input 
                id="username"
                type="text" 
                className={styles.input}
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">كلمة المرور</label>
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

          <AnimatePresence>
            {mode === 'register' && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className={styles.inputGroup}
              >
                <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} />
                  <input 
                    id="confirmPassword"
                    type="password" 
                    className={styles.input}
                    placeholder="أعد كتابة كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                {mode === 'login' ? <LogIn size={20} /> : <Sparkles size={20} />}
                {mode === 'login' ? 'دخول اللوحة' : 'ابدأ التجهيز الآن'}
              </>
            )}
          </button>

          {mode === 'login' && (
             <button 
               type="button"
               className={styles.managerBtn}
               onClick={() => router.push(`/${locale}/manager/login`)}
             >
               <ShieldAlert size={18} />
               مدير المنصة (Super Admin)
             </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
