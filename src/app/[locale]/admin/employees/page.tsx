'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Trash2, 
  AlertCircle,
  Plus,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  UsersRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/lib/session-store';
import { addEmployee, getStoreEmployees, AppUser } from '@/lib/api';
import styles from './employees.module.css';

const AVAILABLE_PERMISSIONS = [
  { id: 'orders.view', name: 'إدارة الطلبات', desc: 'مشاهدة وتحديث حالات الطلبات' },
  { id: 'products.view', name: 'إدارة المنتجات', desc: 'إضافة وتعديل المنتجات والأقسام' },
  { id: 'marketing.view', name: 'التسويق', desc: 'إدارة الكوبونات والعروض' },
  { id: 'reviews.view', name: 'التقييمات', desc: 'إدارة تقييمات العملاء' },
  { id: 'settings.manage', name: 'الإعدادات', desc: 'تعديل هوية وإعدادات المتجر' },
];

export default function EmployeesPage() {
  const t = useTranslations('Admin');
  const { storeSlug } = useSessionStore();
  
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New employee form
  const [newEmp, setNewEmp] = useState({
    username: '',
    email: '',
    password: '',
    permissions: [] as string[]
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (storeSlug) fetchEmployees();
  }, [storeSlug]);

  const fetchEmployees = async () => {
    try {
      const data = await getStoreEmployees(storeSlug!);
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (pid: string) => {
    setNewEmp(prev => ({
      ...prev,
      permissions: prev.permissions.includes(pid) 
        ? prev.permissions.filter(id => id !== pid) 
        : [...prev.permissions, pid]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    
    try {
      await addEmployee(newEmp, storeSlug!);
      setSuccess('تم إضافة الموظف بنجاح!');
      setIsAdding(false);
      setNewEmp({ username: '', email: '', password: '', permissions: [] });
      fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message === 'username_taken' ? 'اسم المستخدم محجوز مسبقاً' : 'حدث خطأ في الإضافة');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <Users size={32} className={styles.icon} />
          <div>
            <h1>إدارة فريق العمل</h1>
            <p>أضف موظفيك وحدد صلاحياتهم بدقة</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          إضافة موظف
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={styles.modalOverlay}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>إضافة موظف جديد</h2>
                <button onClick={() => setIsAdding(false)} className={styles.closeBtn}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.grid}>
                   <div className={styles.inputGroup}>
                      <label>اسم المستخدم (بالإنجليزي)</label>
                      <div className={styles.inputWrapper}>
                        <UserIcon size={18} />
                        <input 
                          required 
                          placeholder="username" 
                          value={newEmp.username}
                          onChange={e => setNewEmp({...newEmp, username: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className={styles.inputGroup}>
                      <label>البريد الإلكتروني</label>
                      <div className={styles.inputWrapper}>
                        <Mail size={18} />
                        <input 
                          required 
                          type="email" 
                          placeholder="email@example.com"
                          value={newEmp.email}
                          onChange={e => setNewEmp({...newEmp, email: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className={styles.inputGroup}>
                      <label>كلمة المرور</label>
                      <div className={styles.inputWrapper}>
                        <Lock size={18} />
                        <input 
                          required 
                          type="password" 
                          placeholder="••••••••"
                          value={newEmp.password}
                          onChange={e => setNewEmp({...newEmp, password: e.target.value})}
                        />
                      </div>
                   </div>
                </div>

                <div className={styles.permissionsArea}>
                   <h3>الصلاحيات الممنوحة</h3>
                   <div className={styles.permissionsGrid}>
                      {AVAILABLE_PERMISSIONS.map(p => (
                        <div 
                          key={p.id} 
                          className={`${styles.permCard} ${newEmp.permissions.includes(p.id) ? styles.permActive : ''}`}
                          onClick={() => handleTogglePermission(p.id)}
                        >
                          <div className={styles.permCheck}>
                             {newEmp.permissions.includes(p.id) ? <ShieldCheck size={20} /> : <Shield size={20} />}
                          </div>
                          <div>
                             <h4>{p.name}</h4>
                             <p>{p.desc}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.actions}>
                  <button type="button" onClick={() => setIsAdding(false)} className={styles.cancelBtn}>إلغاء</button>
                  <button type="submit" disabled={formLoading} className={styles.saveBtn}>
                    {formLoading ? 'جاري الحفظ...' : 'حفظ الموظف'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>جاري تحميل قائمة الموظفين...</div>
        ) : employees.length === 0 ? (
          <div className={styles.empty}>
            <UsersRound size={64} />
            <p>لا يوجد موظفون حالياً في متجرك</p>
          </div>
        ) : (
          <div className={styles.employeesGrid}>
             {employees.map(emp => (
               <div key={emp.uid} className={styles.empCard}>
                  <div className={styles.empInfo}>
                     <div className={styles.empAvatar}>
                        <UserIcon size={24} />
                     </div>
                     <div>
                        <h3>{emp.username}</h3>
                        <p>{emp.email}</p>
                     </div>
                  </div>
                  <div className={styles.empPermissions}>
                     {emp.permissions?.map(p => (
                       <span key={p} className={styles.badge}>{p}</span>
                     ))}
                  </div>
                  <div className={styles.empActions}>
                     <button className={styles.deleteBtn}><Trash2 size={16} /></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
