'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  X,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoreProducts, addProduct, updateProduct, deleteProduct, uploadProductImage, Product } from '@/lib/api';
import styles from './products.module.css';

export default function MerchantProducts() {
  const t = useTranslations('Admin');
  const pt = useTranslations('Product');
  const locale = useLocale();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New States for File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    description: '',
    storeSlug: 'demo'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await getStoreProducts('demo');
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (product: Product | null = null) => {
    setSelectedFile(null);
    setImagePreview(product?.image || null);

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        image: product.image,
        description: product.description || '',
        storeSlug: product.storeSlug
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        category: '',
        image: '',
        description: '',
        storeSlug: 'demo'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let finalImageUrl = formData.image;

      // 1. Upload image if a new file is selected
      if (selectedFile) {
        finalImageUrl = await uploadProductImage(selectedFile, formData.storeSlug);
      }

      const productData = {
        ...formData,
        image: finalImageUrl,
        price: parseFloat(formData.price),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      await loadProducts();
      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
      alert("حدث خطأ أثناء حفظ المنتج.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await deleteProduct(id);
        await loadProducts();
      } catch (error) {
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.productsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('products.title')}</h1>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>{t('products.addNew')}</span>
        </button>
      </div>

      <div className={styles.tableSection}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', right: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              className={styles.input} 
              style={{ paddingRight: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>{t('products.name')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.price')}</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</td></tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.productInfo}>
                        <img src={p.image} className={styles.productImage} alt={p.name} />
                        <span className={styles.productName}>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>{p.price.toLocaleString()} ر.ي</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleOpenModal(p)}>
                          <Edit size={16} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(p.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>لا توجد منتجات بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
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
                  {editingProduct ? t('products.edit') : t('products.addNew')}
                </h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>{t('products.name')}</label>
                    <input 
                      className={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label>{t('products.price')} (ر.ي)</label>
                    <input 
                      type="number"
                      className={styles.input}
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>{t('products.category')}</label>
                    <input 
                      className={styles.input}
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    />
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>صورة المنتج</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px dashed rgba(128,128,128,0.3)', borderRadius: '12px' }}>
                      {imagePreview ? (
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                          <img 
                            src={imagePreview} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
                            alt="Preview" 
                          />
                          <button 
                            type="button"
                            onClick={() => {setSelectedFile(null); setImagePreview(null); setFormData({...formData, image: ''});}}
                            style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '24px', height: '24px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <ImageIcon size={48} style={{ opacity: 0.3 }} />
                          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>اختر صورة للمنتج</p>
                        </div>
                      )}
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload" 
                        style={{ 
                          padding: '0.5rem 1.5rem', 
                          background: 'rgba(var(--primary-rgb), 0.1)', 
                          borderRadius: '8px', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          color: '#3b82f6'
                        }}
                      >
                        {imagePreview ? 'تغيير الصورة' : 'اختر ملف'}
                      </label>
                    </div>
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>الوصف</label>
                    <textarea 
                      className={styles.textarea}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                    {t('products.cancel')}
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : t('products.save')}
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
