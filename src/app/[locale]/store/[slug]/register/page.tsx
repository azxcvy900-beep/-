'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, ArrowLeft, Loader2, Phone } from 'lucide-react';
import { registerCustomer } from '@/lib/api';
import { useCustomerSessionStore } from '@/lib/customer-session-store';
import { toast } from 'sonner';
import Link from 'next/link';
import styles from '../login/login.module.css'; // Reuse login styles

export default function CustomerRegisterPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const { slug } = useParams();
  const router = useRouter();
  const login = useCustomerSessionStore((state) => state.login);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      await registerCustomer({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      // Auto-login after registration
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('تم إنشاء الحساب بنجاح');
        router.push(`/${locale}/store/${slug}`);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error('حدث خطأ أثناء إنشاء الحساب');
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
          <Link href={`/${locale}/store/${slug}/login`} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <h1>إنشاء حساب</h1>
          <p>انضم إلينا واستمتع بتجربة تسوق أفضل</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>الاسم الكامل</label>
            <div className={styles.inputWrapper}>
              <User className={styles.icon} size={18} />
              <input 
                type="text" 
                placeholder="أدخل اسمك"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>البريد الإلكتروني</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.icon} size={18} />
              <input 
                type="email" 
                placeholder="example@mail.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>رقم الهاتف</label>
            <div className={styles.inputWrapper}>
              <Phone className={styles.icon} size={18} />
              <input 
                type="tel" 
                placeholder="967770000000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>تأكيد كلمة المرور</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.icon} size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required 
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.spin} size={20} /> : <UserPlus size={20} />}
            إنشاء حساب
          </button>
        </form>

        <div className={styles.footer}>
          <span>لديك حساب بالفعل؟</span>
          <Link href={`/${locale}/store/${slug}/login`} className={styles.registerLink}>
            تسجيل الدخول
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
