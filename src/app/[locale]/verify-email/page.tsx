'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { applyActionCode } from 'firebase/auth';
import styles from './verify.module.css';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    // If there's no code or it's not email verification mode, error out
    if (!oobCode || mode !== 'verifyEmail') {
      setStatus('error');
      setError('الرابط غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد من صفحة الدخول.');
    }
  }, [oobCode, mode]);

  const handleVerify = async () => {
    if (!oobCode) return;
    
    setStatus('loading');
    setError('');

    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/${locale}/admin/login`);
      }, 3000);
    } catch (err: any) {
      console.error("Verification error:", err);
      setStatus('error');
      if (err.code === 'auth/expired-action-code') {
        setError('انتهت صلاحية هذا الرابط. يرجى إعادة إرسال رابط تفعيل جديد.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('كود التفعيل غير صحيح أو تم استخدامه مسبقاً.');
      } else {
        setError('حدث خطأ أثناء محاولة تفعيل الحساب. يرجى المحاولة لاحقاً.');
      }
    }
  };

  return (
    <div className={styles.verifyContainer}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <AnimatePresence mode="wait">
          {status !== 'success' ? (
            <motion.div key="pending" exit={{ opacity: 0, scale: 0.95 }}>
              <div className={styles.iconWrapper}>
                <ShieldCheck size={40} />
              </div>
              <h1 className={styles.title}>تفعيل حساب التاجر</h1>
              <p className={styles.desc}>
                أهلاً بك في منصة بايرز. اضغط على الزر أدناه لتأكيد ملكية بريدك الإلكتروني وتفعيل متجرك بشكل كامل.
              </p>

              {status === 'error' && (
                <div className={styles.errorMsg}>
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button 
                className={styles.verifyBtn}
                onClick={handleVerify}
                disabled={status === 'loading' || status === 'error'}
              >
                {status === 'loading' ? (
                  <div className={styles.spinner} />
                ) : (
                  <>
                    <Sparkles size={20} />
                    تأكيد التفعيل الآن
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.successWrapper}
            >
              <div className={styles.iconWrapper} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle2 size={40} />
              </div>
              <h1 className={styles.title}>تم التفعيل بنجاح!</h1>
              <p className={styles.desc}>
                مبروك! تم تفعيل حسابك بنجاح. يمكنك الآن الدخول إلى لوحة التحكم والبدء في بناء إمبراطوريتك التجارية.
              </p>
              
              <div className={styles.successMsg}>
                جاري توجيهك لصفحة الدخول...
              </div>

              <button 
                className={styles.verifyBtn}
                style={{ marginTop: '2rem' }}
                onClick={() => router.push(`/${locale}/admin/login`)}
              >
                دخول لوحة التحكم
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className={styles.footer}>
          &copy; {new Date().getFullYear()} بايرز - منصة التجارة الإلكترونية الشاملة
        </footer>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
