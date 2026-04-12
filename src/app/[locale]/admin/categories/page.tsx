'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Upload,
  Grid,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getStoreCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory, 
  uploadCategoryImage, 
  Category 
} from '@/lib/api';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import styles from './categories.module.css';

export default function AdminCategories() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  const [localCategories, setLocalCategories] = useState<Category[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const { data: initialCategories, loading: categoriesLoading } = useStreamingFetch(
    () => getStoreCategories(storeSlug || 'demo'), 
    [storeSlug],
    `categories_${storeSlug || 'demo'}`
  );

  useEffect(() => {
    if (initialCategories) setLocalCategories(initialCategories);
  }, [initialCategories]);

  const { visibleItems: visibleCategories } = useProgressiveLoad(localCategories || [], 6, 100);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [categoryName, setCategoryName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleOpenModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setImagePreview(category.image || null);
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setImagePreview(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميجابايت.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;
    
    setIsSubmitting(true);
    setStatusMessage(null);
    
    try {
      let iconUrl = editingCategory?.image || '';

      if (selectedFile) {
        // uploadCategoryImage now includes client-side compression (handled in api.ts)
        iconUrl = await uploadCategoryImage(selectedFile, storeSlug || 'demo');
      }

      const categoryData = {
        name: categoryName,
        image: iconUrl,
        storeSlug: storeSlug || 'demo'
      };

      if (editingCategory) {
        await updateCategory(storeSlug || 'demo', editingCategory.id, categoryData);
      } else {
        await addCategory(categoryData);
      }
      
      // Refresh local state
      const fresh = await getStoreCategories(storeSlug || 'demo');
      setLocalCategories(fresh);
      
      setStatusMessage({ type: 'success', text: 'تم حفظ القسم بنجاح' });
      setTimeout(() => handleCloseModal(), 1000);
    } catch (error) {
      console.error("Error saving category:", error);
      setStatusMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟ سيتم إلغاء ربطه بالمنتجات التابعة له.")) {
      const originalCategories = [...(localCategories || [])];
      setLocalCategories(prev => prev ? prev.filter(c => c.id !== id) : null);
      
      try {
        await deleteCategory(storeSlug || 'demo', id);
        setStatusMessage({ type: 'success', text: 'تم حذف القسم بنجاح' });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (error) {
        alert("حدث خطأ أثناء الحذف.");
        setLocalCategories(originalCategories);
      }
    }
  };

  return (
    <div className={styles.categoriesPage}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>إدارة الأقسام</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>نظم منتجاتك بهوية بصرية فاخرة واحترافية</p>
        </div>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>إضافة قسم جديد</span>
        </button>
      </header>

      {statusMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${styles.statusAlert} ${styles[statusMessage.type]}`}
          style={{
            padding: '1rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${statusMessage.type === 'success' ? '#bcf0da' : '#fecaca'}`
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 700 }}>{statusMessage.text}</span>
        </motion.div>
      )}

      {categoriesLoading && visibleCategories.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
          <Loader2 className="animate-spin" size={48} color="#3b82f6" />
        </div>
      ) : (
        <div className={styles.categoriesGrid}>
          <AnimatePresence>
            {visibleCategories.map((cat: Category, index: number) => (
              <motion.div 
                key={cat.id} 
                className={styles.categoryCard}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className={styles.categoryIcon}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} />
                  ) : (
                    <Grid size={40} color="#3b82f6" />
                  )}
                </div>
                <div className={styles.categoryInfo}>
                  <h3 className={styles.categoryName}>{cat.name}</h3>
                </div>
                <div className={styles.actions}>
                  <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleOpenModal(cat)}>
                    <Edit size={18} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(cat.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {visibleCategories.length === 0 && !categoriesLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem', background: 'var(--card-bg)', borderRadius: '32px', border: '2px dashed rgba(0,0,0,0.05)' }}>
              <Grid size={64} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>لا توجد أقسام بعد</h3>
              <p style={{ color: '#64748b' }}>ابدأ ببناء هوية متجرك بإضافة أول قسم الآن</p>
            </div>
          )}
        </div>
      )}

      {/* Category Modal - Ultra Glass */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeBtn} onClick={handleCloseModal} style={{ position: 'absolute', top: '2rem', left: '2rem', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}
                </h3>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>أدخل تفاصيل القسم وصورة معبرة</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>اسم القسم</label>
                  <input 
                    className={styles.input}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="مثال: إلكترونيات، عطور..."
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>أيقونة القسم / الشعار</label>
                  <label htmlFor="cat-image" className={styles.uploadArea}>
                    {imagePreview ? (
                      <motion.img 
                        initial={{ scale: 0.8 }} 
                        animate={{ scale: 1 }} 
                        src={imagePreview} 
                        className={styles.preview} 
                        alt="Preview" 
                      />
                    ) : (
                      <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <Upload size={32} color="#3b82f6" />
                        </div>
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>انقر لرفع أيقونة القسم</span>
                      </>
                    )}
                    <input 
                      id="cat-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={handleCloseModal} disabled={isSubmitting}>
                    إلغاء
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      'حفظ القسم'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
