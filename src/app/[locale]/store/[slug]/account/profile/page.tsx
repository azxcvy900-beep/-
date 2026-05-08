'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Save, 
  ChevronRight,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useCustomerSessionStore } from '@/lib/customer-session-store';
import { updateCustomerProfile } from '@/lib/api';
import { getAuth, updatePassword } from 'firebase/auth';
import { toast } from 'sonner';
import Link from 'next/link';
import styles from './profile.module.css';

export default function ProfilePage() {
  const locale = useLocale();
  const { slug } = useParams();
  const router = useRouter();
  const { isLoggedIn, email, username, phone, uid, _hasHydrated } = useCustomerSessionStore();

  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) {
      router.push(`/${locale}/store/${slug}/login`);
    } else if (isLoggedIn) {
      setFormData(prev => ({
        ...prev,
        username: username || '',
        phone: phone || ''
      }));
    }
  }, [_hasHydrated, isLoggedIn, username, phone]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      // 1. Update Profile in Firestore
      await updateCustomerProfile(uid, {
        username: formData.username,
        phone: formData.phone
      });

      // 2. Update Password if provided
      if (formData.newPassword) {
        const auth = getAuth();
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, formData.newPassword);
        }
      }

      toast.success('تم تحديث البيانات بنجاح');
      // Note: In a real app, we should also update the local Zustand store here
      // For now, let's just redirect back
      router.push(`/${locale}/store/${slug}/account`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('يرجى إعادة تسجيل الدخول لتغيير كلمة المرور لدواعي أمنية');
      } else {
        toast.error('حدث خطأ أثناء التحديث');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!_hasHydrated || !isLoggedIn) return null;

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href={`/${locale}/store/${slug}/account`} className={styles.backBtn}>
            <ChevronRight size={20} />
            <span>العودة للحساب</span>
          </Link>
          <h1>تعديل الملف الشخصي</h1>
        </header>

        <form onSubmit={handleSave} className={styles.form}>
          <section className={styles.section}>
            <h3>المعلومات الأساسية</h3>
            <div className={styles.inputGroup}>
              <label><User size={18} /> الاسم الكامل</label>
              <input 
                type="text" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label><Phone size={18} /> رقم الهاتف</label>
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label><Mail size={18} /> البريد الإلكتروني (لا يمكن تغييره)</label>
              <input type="email" value={email || ''} disabled className={styles.disabledInput} />
            </div>
          </section>

          <section className={styles.section}>
            <h3>تغيير كلمة المرور</h3>
            <p className={styles.note}>اترك الحقول فارغة إذا كنت لا تريد تغييرها.</p>
            <div className={styles.inputGroup}>
              <label><Lock size={18} /> كلمة المرور الجديدة</label>
              <input 
                type="password" 
                value={formData.newPassword} 
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                placeholder="********"
              />
            </div>
            <div className={styles.inputGroup}>
              <label><Lock size={18} /> تأكيد كلمة المرور</label>
              <input 
                type="password" 
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="********"
              />
            </div>
          </section>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.spin} size={20} /> : <Save size={20} />}
            <span>حفظ التغييرات</span>
          </button>
        </form>
      </div>
    </div>
  );
}
