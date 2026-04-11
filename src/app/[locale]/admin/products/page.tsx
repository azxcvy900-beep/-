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
import { 
  getStoreProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  uploadProductImage, 
  getStoreCategories,
  Product, 
  Category
} from '@/lib/api';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { compressImage } from '@/lib/utils';
import { TableSkeleton } from '@/components/shared/Skeletons/Skeletons';
import styles from './products.module.css';

export default function MerchantProducts() {
  const t = useTranslations('Admin');
  const pt = useTranslations('Product');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  const [localProducts, setLocalProducts] = useState<Product[] | null>(null);
  
  // SWR Initial Fetches
  const { data: initialProducts, loading: productsLoading } = useStreamingFetch(
    () => getStoreProducts(storeSlug || 'demo'), 
    [storeSlug],
    `products_${storeSlug || 'demo'}`
  );

  const { data: storeCategories } = useStreamingFetch(
    () => getStoreCategories(storeSlug || 'demo'), 
    [storeSlug],
    `categories_${storeSlug || 'demo'}`
  );

  // Sync state
  useEffect(() => {
    if (initialProducts) setLocalProducts(initialProducts);
  }, [initialProducts]);
  
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
    originalPrice: '',
    category: '',
    image: '',
    description: '',
    storeSlug: storeSlug || 'demo',
    stockCount: '0',
    currency: 'YER' as 'YER' | 'SAR' | 'USD'
  });

  // Filter and progressive load
  const filteredProducts = React.useMemo(() => {
    return (localProducts || []).filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localProducts, searchQuery]);

  const { visibleItems: visibleProducts } = useProgressiveLoad(filteredProducts, 5, 100);

  // Set default category when categories arrive
  useEffect(() => {
    if (storeCategories && storeCategories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: storeCategories[0].name }));
    }
  }, [storeCategories, formData.category]);

  const handleOpenModal = (product: Product | null = null) => {
    setSelectedFile(null);
    setImagePreview(product?.image || null);

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        category: product.category,
        image: product.image,
        description: product.description || '',
        storeSlug: product.storeSlug,
        stockCount: product.stockCount.toString(),
        currency: product.currency || 'YER'
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        originalPrice: '',
        category: storeCategories && storeCategories.length > 0 ? storeCategories[0].name : '',
        image: '',
        description: '',
        storeSlug: storeSlug || 'demo',
        stockCount: '0',
        currency: 'YER'
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
        // Optimized: Compress product image before upload (1024px limit for quality+speed)
        const compressed = await compressImage(selectedFile, 1024, 0.7);
        finalImageUrl = await uploadProductImage(compressed, formData.storeSlug);
      }

      const stockNum = parseInt(formData.stockCount) || 0;

      const productData = {
        ...formData,
        image: finalImageUrl,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        stockCount: stockNum,
        inStock: stockNum > 0,
        currency: formData.currency
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData as any);
      } else {
        await addProduct(productData as any);
      }
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
      // Optimistic delete
      setLocalProducts(prev => prev ? prev.filter(p => p.id !== id) : null);
      
      try {
        await deleteProduct(id);
      } catch (error) {
        alert("حدث خطأ أثناء الحذف.");
        // Refresh on error
        const fresh = await getStoreProducts(storeSlug || 'demo');
        setLocalProducts(fresh);
      }
    }
  };



  // --- NEW FEATURES: Print & Export ---
  const handlePrintInventory = (categoryName: string | null = null) => {
    const printProducts = categoryName 
      ? (localProducts || []).filter((p: Product) => p.category === categoryName)
      : (localProducts || []);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>تقرير المخزون - ${categoryName || 'الكل'}</title>
          <style>
            body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            th { background-color: #f8fafc; }
            .header { text-align: center; margin-bottom: 30px; }
            .low-stock { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير جرد المخزون - ${new Date().toLocaleDateString('ar-YE')}</h1>
            <p>القسم: ${categoryName || 'كافة الأقسام'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>القسم</th>
                <th>السعر</th>
                <th>الكمية المتوفرة</th>
              </tr>
            </thead>
            <tbody>
              ${printProducts.map((p: Product) => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td>${p.price.toLocaleString()} ر.ي</td>
                  <td class="${p.stockCount < 5 ? 'low-stock' : ''}">${p.stockCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'In Stock'];
    const rows = (localProducts || []).map((p: Product) => [
      p.id,
      p.name,
      p.category,
      p.price,
      p.stockCount,
      p.inStock ? 'Yes' : 'No'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.productsPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('products.title')}</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className={styles.exportBtn} onClick={handleExportCSV}>
            <span>تصدير CSV</span>
          </button>
          <button className={styles.addBtn} onClick={() => handleOpenModal()}>
            <Plus size={20} />
            <span>{t('products.addNew')}</span>
          </button>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              className={styles.input} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className={styles.printActions}>
             <button className={styles.printBtn} onClick={() => handlePrintInventory()}>
                طباعة كافة الكميات
             </button>
             <select 
               className={styles.select}
               onChange={(e) => e.target.value && handlePrintInventory(e.target.value)}
               defaultValue=""
             >
                <option value="" disabled>طباعة حسب القسم...</option>
                {(storeCategories || []).map((cat: Category) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>{t('products.name')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.price')}</th>
                <th>المخزون</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
             <tbody>
              {productsLoading && visibleProducts.length === 0 ? (
                <TableSkeleton rows={5} />
              ) : visibleProducts.length > 0 ? (
                visibleProducts.map((p: Product) => (
                  <motion.tr 
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td>
                      <div className={styles.productInfo}>
                        <div style={{ position: 'relative' }}>
                          <img src={p.image} className={styles.productImage} alt={p.name} />
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>SALE</span>
                          )}
                        </div>
                        <span className={styles.productName}>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700 }}>
                          {p.price.toLocaleString()} {p.currency === 'SAR' ? 'ر.س' : p.currency === 'USD' ? '$' : 'ر.ي'}
                        </span>
                        {p.originalPrice && (
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                            {p.originalPrice.toLocaleString()} {p.currency === 'SAR' ? 'ر.س' : p.currency === 'USD' ? '$' : 'ر.ي'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {p.stockCount <= 0 ? (
                        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>نفد</span>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>{p.stockCount} متوفر</span>
                      )}
                    </td>
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
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>لا توجد منتجات بعد.</td></tr>
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
                    <label>السعر الحالي</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="number"
                        className={styles.input}
                        style={{ flex: 1 }}
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                      />
                      <select 
                        className={styles.input}
                        style={{ width: '80px' }}
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value as any})}
                      >
                        <option value="YER">ر.ي</option>
                        <option value="SAR">ر.س</option>
                        <option value="USD">$</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>السعر السابق (اختياري)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="number"
                        className={styles.input}
                        style={{ flex: 1 }}
                        placeholder="لإظهار خصم..."
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#64748b', minWidth: '40px' }}>
                        {formData.currency === 'SAR' ? 'ر.س' : formData.currency === 'USD' ? '$' : 'ر.ي'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>{t('products.category')}</label>
                    <select 
                      className={styles.input}
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      {storeCategories && storeCategories.length > 0 ? (
                        storeCategories.map((cat: Category) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))
                      ) : (
                        <option value="">لا توجد أقسام - يرجى إضافة قسم أولاً</option>
                      )}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>الكمية المتوفرة</label>
                    <input 
                      type="number"
                      className={styles.input}
                      value={formData.stockCount}
                      onChange={(e) => setFormData({...formData, stockCount: e.target.value})}
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
