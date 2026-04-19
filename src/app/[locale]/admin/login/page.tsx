'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
  Mail,
  ArrowLeft,
  ShoppingBag,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { useSessionStore } from '@/lib/session-store';
import { registerMerchant, loginMerchant } from '@/lib/api';
import styles from './login.module.css';

type AuthMode = 'login' | 'register';

export default function AdminLoginPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, role, storeSlug, loginAsMerchant } = useSessionStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);

  const bgImage = "";

  useEffect(() => {
    // Only trigger auto-redirect if we are sure of the role and login status
    if (isLoggedIn && role === 'merchant') {
       const target = storeSlug ? `/${locale}/admin/dashboard` : `/${locale}/admin/setup`;
       console.log(`Redirecting to: ${target}`);
       router.replace(target);
    }
  }, [isLoggedIn, role, storeSlug, router, locale]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setVerificationPending(false);

    try {
      const successStatus = await loginAsMerchant(username, password);
      
      if (successStatus) {
        // Need to check if email is verified via a helper or direct auth check
        // For simplicity, we can use a direct check if we export auth
        const { auth } = await import('@/lib/firebase');
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          setVerificationPending(true);
          setEmail(auth.currentUser.email || ''); // Capture the email for display
          setError('يرجى تفعيل حسابك عبر الرابط المرسل لبريدك الإلكتروني أولاً.');
          setLoading(false);
          return;
        }

        setSuccess('تم تسجيل الدخول بنجاح! جاري التوجيه...');
        
        // Immediate check of current state to pick the right path
        const state = useSessionStore.getState();
        const target = state.storeSlug ? `/${locale}/admin/dashboard` : `/${locale}/admin/setup`;
        
        setTimeout(() => {
          router.push(target);
        }, 1000); // Slightly longer timeout to allow state propagation
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('بيانات الدخول غير صحيحة. تأكد من البريد/الاسم وكلمة المرور.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('تمت محاولة الدخول عدة مرات بشكل خاطئ. يرجى المحاولة لاحقاً.');
      } else {
        setError('حدث خطأ أثناء الاتصال بنظام الحماية.');
      }
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
      await registerMerchant({ username, password, email });
      setSuccess('مبارك! تم إنشاء الحساب. أرسلنا رابط تفعيل لبريدك الإلكتروني، يرجى استخدامه لتتمكن من الدخول.');
      // Switch to login mode so they can enter after verifying
      setTimeout(() => {
        setMode('login');
        setSuccess('');
        setVerificationPending(true);
      }, 3000);
    } catch (err: any) {
      console.error("Reg error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل مسبقاً.');

      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('عذراً، نظام التسجيل بالبريد معطل حالياً من الإدارة.');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب. تأكد من صحة البيانات.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { requestEmailVerification } = await import('@/lib/api');
      await requestEmailVerification();
      setSuccess('تم إعادة إرسال رابط التفعيل! يرجى تفقد بريدك الوارد (Inbox) أو مجلد الرسائل المزعجة (Spam).');
      
      // Auto-hide success after 10s
      setTimeout(() => setSuccess(''), 10000);
    } catch (err: any) {
      console.error("Resend error:", err);
      if (err.code === 'auth/too-many-requests') {
        setError('لقد قمت بمحاولات عديدة. يرجى الانتظار قليلاً قبل إعادة المحاولة.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('خطأ في الإعدادات: هذا النطاق غير مصرح له بإرسال البريد. يرجى مراجعة إعدادات Firebase Console.');
      } else {
        setError('فشلت محاولة إعادة الإرسال. تأكد من اتصالك بالإنترنت وحاول مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles.loginContainer}>
      {/* Side Panel (Visual Content) */}
      <section className={styles.sidePanel}>
        <div className={styles.visualBg}>
           <Image 
             src={bgImage}
             alt="Merchant Background"
             fill
             style={{ objectFit: 'cover' }}
             priority
           />
        </div>
        <div className={styles.visualOverlay} />
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={styles.visualContent}
        >
          <div className={styles.logoArea} style={{ marginBottom: '4rem' }}>
             <ShoppingBag size={42} style={{ color: '#10b981' }} />
          </div>
          <h1 className={styles.visualTitle}>
             انطلق بمتجرك <br />
             إلى <span>آفاق عالمية</span>
          </h1>
          <p className={styles.visualDesc}>
            انضم لأكثر من 500 تاجر في اليمن والوطن العربي يديرون مبيعاتهم بذكاء وبساطة عبر منصة بايرز.
          </p>

          <div className={styles.statsGrid}>
             <div className={styles.statItem}>
                <h3>24/7</h3>
                <p>دعم فني متواصل</p>
             </div>
             <div className={styles.statItem}>
                <h3>+15k</h3>
                <p>منتج مباع</p>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Form Panel */}
      <section className={styles.formPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.logoArea}>
            <div className={styles.logo}>بايرز <span>تجار</span></div>
          </div>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={18} />
                دخول
              </div>
              {mode === 'login' && (
                <motion.div 
                  layoutId="tab-underline"
                  className={styles.tabUnderline}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
            <button 
              className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            >
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} />
                اشتراك جديد
              </div>
              {mode === 'register' && (
                <motion.div 
                  layoutId="tab-underline"
                  className={styles.tabUnderline}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          </div>

          <header className={styles.header}>
            <h2 className={styles.title}>
              {mode === 'login' ? 'أهلاً بعودتك' : 'ابدأ نجاحك اليوم'}
            </h2>
            <p className={styles.subtitle}>
              {mode === 'login' 
                ? 'سجل دخولك لإدارة مبيعاتك وطلبات عملاءك' 
                : 'أنشئ حساباً وأطلق متجرك للجمهور في 5 دقائق'}
            </p>
          </header>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.errorMsg}
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.successMsg}
              >
                <CheckCircle2 size={18} />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className={styles.form}>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <User size={18} />
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder=" "
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <label className={styles.inputLabel}>اسم التاجر أو المؤسسة</label>
              </div>
            </div>


            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={styles.inputGroup}
                >
                  <div className={styles.inputWrapper}>
                    <Mail size={18} />
                    <input 
                      type="email" 
                      className={styles.input}
                      placeholder=" "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <label className={styles.inputLabel}>البريد الإلكتروني</label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <Lock size={18} />
                <input 
                  type="password" 
                  className={styles.input}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label className={styles.inputLabel}>كلمة المرور</label>
              </div>
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={styles.inputGroup}
                >
                  <div className={styles.inputWrapper}>
                    <Lock size={18} />
                    <input 
                      type="password" 
                      className={styles.input}
                      placeholder=" "
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <label className={styles.inputLabel}>تأكيد كلمة المرور</label>
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
                  {mode === 'login' ? <Zap size={20} /> : <Award size={20} />}
                  {mode === 'login' ? 'دخول لوحة التحكم' : 'إطلاق متجري الإلكتروني'}
                </>
              )}
            </button>

            {verificationPending && (
              <div className={styles.resendWrapper}>
                <p className={styles.emailDisplay}>
                  تم الإرسال إلى: <strong>{email}</strong>
                </p>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleResendEmail}
                  className={styles.resendBtn}
                  disabled={loading}
                >
                  <Mail size={16} />
                  لم تصلك الرسالة؟ إعادة إرسال رابط التحقق
                </motion.button>
                <p className={styles.spamHint}>* تأكد من فحص مجلد الرسائل غير المرغوب فيها (Spam/Junk).</p>
              </div>
            )}


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

          <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                onClick={() => router.push(`/${locale}`)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#64748b', 
                  fontSize: '0.85rem', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer' 
                }}
              >
                <ArrowLeft size={16} style={{ transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }} /> 
                {t('backToHome')}
              </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
