'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Image as ImageIcon, 
  Upload,
  Grid,
  Loader2
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
  
  const { data: initialCategories, loading: categoriesLoading } = useStreamingFetch(
    () => getStoreCategories(storeSlug || 'demo'), 
    [storeSlug],
    `categories_${storeSlug || 'demo'}`
  );

  useEffect(() => {
    if (initialCategories) setLocalCategories(initialCategories);
  }, [initialCategories]);

  const { visibleItems: visibleCategories } = useProgressiveLoad(localCategories || [], 4, 150);
  
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
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    
    try {
      let iconUrl = editingCategory?.image || '';

      if (selectedFile) {
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
      
      handleCloseModal();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("حدث خطأ أثناء حفظ القسم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟ سيتم إلغاء ربطه بالمنتجات التابعة له.")) {
      // Optimistic delete
      setLocalCategories(prev => prev ? prev.filter(c => c.id !== id) : null);
      
      try {
        await deleteCategory(storeSlug || 'demo', id);
      } catch (error) {
        alert("حدث خطأ أثناء الحذف.");
        const fresh = await getStoreCategories(storeSlug || 'demo');
        setLocalCategories(fresh);
      }
    }
  };

  return (
    <div className={styles.categoriesPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة الأقسام</h1>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {categoriesLoading && visibleCategories.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
      ) : (
        <div className={styles.categoriesGrid}>
          {visibleCategories.map((cat: Category) => (
            <motion.div 
              key={cat.id} 
              className={styles.categoryCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.categoryIcon} style={{ borderRadius: '50%', overflow: 'hidden', width: '64px', height: '64px', border: '2px solid rgba(var(--primary-rgb), 0.1)' }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', object-fit: 'cover' }} />
                ) : (
                  <Grid size={32} color="var(--primary)" />
                )}
              </div>
              <div className={styles.categoryInfo}>
                <h3 className={styles.categoryName}>{cat.name}</h3>
              </div>
              <div className={styles.actions}>
                <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleOpenModal(cat)}>
                  <Edit size={16} />
                </button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(cat.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
          {visibleCategories.length === 0 && !categoriesLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '16px' }}>
              لا توجد أقسام مضافة بعد. ابدأ بإضافة قسم لمتجرك!
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={styles.modal}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 className={styles.modalTitle}>
                  {editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>اسم القسم</label>
                  <input 
                    className={styles.input}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="مثال: هواتف ذكية، عطور، ملابس..."
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>أيقونة القسم / الشعار</label>
                  <label htmlFor="cat-image" className={styles.uploadArea}>
                    {imagePreview ? (
                      <img src={imagePreview} className={styles.preview} alt="Preview" />
                    ) : (
                      <>
                        <Upload size={32} color="#9ca3af" />
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>انقر لرفع أيقونة أو صورة للقسم</span>
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
                  <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                    إلغاء
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ القسم'}
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
