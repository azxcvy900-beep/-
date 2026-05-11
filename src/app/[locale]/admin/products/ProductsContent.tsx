'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  X,
  Package,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  LayoutGrid,
  ArrowRight,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getStoreProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  uploadProductImage, 
  getStoreCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  Product, 
  Category
} from '@/lib/api';
import { useStreamingFetch, useProgressiveLoad } from '@/lib/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { compressImage } from '@/lib/utils';
import { triggerHaptic } from '@/lib/utils';
import { TableSkeleton } from '@/components/shared/Skeletons/Skeletons';
import styles from './products.module.css';

export default function ProductsContent() {
  const t = useTranslations('Admin');
  const pt = useTranslations('Product');
  const locale = useLocale();
  const { storeSlug } = useAuthStore();
  
  const [currentView, setCurrentView] = useState<'categories' | 'products'>('categories');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[] | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[] | null>(null);
  
  const { data: initialProducts, loading: productsLoading } = useStreamingFetch(
    () => getStoreProducts(storeSlug || 'demo'), 
    [storeSlug],
    `products_${storeSlug || 'demo'}`
  );

  const { data: initialCategories, loading: categoriesLoading } = useStreamingFetch(
    () => getStoreCategories(storeSlug || 'demo'), 
    [storeSlug],
    `categories_${storeSlug || 'demo'}`
  );

  useEffect(() => {
    if (initialProducts) setLocalProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (initialCategories) setLocalCategories(initialCategories);
  }, [initialCategories]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState<{ [key: number]: string }>({});

  const [productFormData, setProductFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: '',
    image: '',
    description: '',
    storeSlug: storeSlug || 'demo',
    stockCount: '0',
    currency: 'YER' as 'YER' | 'SAR' | 'USD',
    options: [] as any[]
  });

  const [categoryName, setCategoryName] = useState('');

  const filteredProducts = React.useMemo(() => {
    let list = localProducts || [];
    if (selectedCategoryName) {
      list = list.filter(p => p.category === selectedCategoryName);
    }
    return list.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localProducts, searchQuery, selectedCategoryName]);

  const { visibleItems: visibleProducts } = useProgressiveLoad(filteredProducts, 10, 100);
  const { visibleItems: visibleCategories } = useProgressiveLoad(localCategories || [], 20, 100);

  const handleOpenProductModal = (product: Product | null = null) => {
    triggerHaptic('light');
    setSelectedFile(null);
    setImagePreview(product?.image || null);

    if (product) {
      setEditingProduct(product);
      setProductFormData({
        name: product.name,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        category: product.category,
        image: product.image,
        description: product.description || '',
        storeSlug: product.storeSlug,
        stockCount: product.stockCount.toString(),
        currency: product.currency || 'YER',
        options: product.options || []
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        name: '',
        price: '',
        originalPrice: '',
        category: selectedCategoryName || (localCategories && localCategories.length > 0 ? localCategories[0].name : ''),
        image: '',
        description: '',
        storeSlug: storeSlug || 'demo',
        stockCount: '0',
        currency: 'YER',
        options: []
      });
    }
    setIsProductModalOpen(true);
  };

  const handleOpenCategoryModal = (category: Category | null = null) => {
    triggerHaptic('light');
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
    setIsCategoryModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setIsSubmitting(true);
    try {
      let finalImageUrl = productFormData.image;
      if (selectedFile) {
        const compressed = await compressImage(selectedFile, 1024, 0.7);
        finalImageUrl = await uploadProductImage(compressed, productFormData.storeSlug);
      }
      const stockNum = parseInt(productFormData.stockCount) || 0;
      const productData: any = {
        ...productFormData,
        image: finalImageUrl,
        price: parseFloat(productFormData.price),
        stockCount: stockNum,
        inStock: stockNum > 0,
        currency: productFormData.currency
      };
      if (productFormData.originalPrice) {
        productData.originalPrice = parseFloat(productFormData.originalPrice);
      } else {
        productData.originalPrice = null;
      }
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData as any);
      } else {
        await addProduct(productData as any);
      }
      setIsProductModalOpen(false);
      const fresh = await getStoreProducts(storeSlug || 'demo');
      setLocalProducts(fresh);
    } catch (error) {
      console.error("Submit error:", error);
      alert("حدث خطأ أثناء حفظ المنتج.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
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
      const fresh = await getStoreCategories(storeSlug || 'demo');
      setLocalCategories(fresh);
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
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

  const handleDeleteProduct = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      triggerHaptic('heavy');
      setLocalProducts(prev => prev ? prev.filter(p => p.id !== id) : null);
      try {
        await deleteProduct(id);
      } catch (error) {
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      triggerHaptic('heavy');
      setLocalCategories(prev => prev ? prev.filter(c => c.id !== id) : null);
      try {
        await deleteCategory(storeSlug || 'demo', id);
      } catch (error) {
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const renderCategoriesView = () => (
    <div className={styles.categoriesView}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>أقسام المتجر</h1>
          <p className={styles.subtitle}>اختر قسماً لعرض منتجاته أو إدارتها</p>
        </div>
        <button className={styles.addBtn} onClick={() => handleOpenCategoryModal()}>
          <Plus size={20} />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      <div className={styles.categoriesGrid}>
        <AnimatePresence>
          {visibleCategories.map((cat, index) => (
            <motion.div 
              key={cat.id} 
              className={styles.categoryCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                setSelectedCategoryName(cat.name);
                setCurrentView('products');
                triggerHaptic('light');
              }}
            >
              <div className={styles.categoryIcon}>
                {cat.image ? <img src={cat.image} alt={cat.name} /> : <LayoutGrid size={40} />}
              </div>
              <h3 className={styles.categoryName}>{cat.name}</h3>
              <p className={styles.productCount}>
                {(localProducts || []).filter(p => p.category === cat.name).length} منتج
              </p>
              <div className={styles.categoryActions}>
                 <button onClick={(e) => { e.stopPropagation(); handleOpenCategoryModal(cat); }} className={styles.catActionBtn}><Edit size={16} /></button>
                 <button onClick={(e) => handleDeleteCategory(cat.id, e)} className={`${styles.catActionBtn} ${styles.deleteCatBtn}`}><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {visibleCategories.length === 0 && !categoriesLoading && (
          <div className={styles.emptyCategories}>
             <LayoutGrid size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
             <p>لا توجد أقسام بعد. ابدأ بإضافة أول قسم لمتجرك.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProductsView = () => (
    <div className={styles.productsView}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className={styles.backBtn} onClick={() => setCurrentView('categories')}>
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className={styles.title}>{selectedCategoryName}</h1>
            <p className={styles.subtitle}>إدارة منتجات هذا القسم</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => handleOpenProductModal()}>
          <Plus size={20} />
          <span>إضافة منتج لهذا القسم</span>
        </button>
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
         </div>

         <div className={styles.tableWrapper}>
            <table className={styles.productTable}>
               <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>المخزون</th>
                    <th>الإجراءات</th>
                  </tr>
               </thead>
               <tbody>
                  {visibleProducts.map(p => (
                    <tr key={p.id}>
                       <td>
                          <div className={styles.productInfo}>
                             <img src={p.image} className={styles.productImage} />
                             <span className={styles.productName}>{p.name}</span>
                          </div>
                       </td>
                       <td>{p.price.toLocaleString()} {p.currency}</td>
                       <td>
                          <span className={p.stockCount > 0 ? styles.inStock : styles.outOfStock}>
                            {p.stockCount} متوفر
                          </span>
                       </td>
                       <td>
                          <div className={styles.actions}>
                             <button className={styles.editBtn} onClick={() => handleOpenProductModal(p)}><Edit size={16} /></button>
                             <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(p.id)}><Trash2 size={16} /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {visibleProducts.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>لا توجد منتجات في هذا القسم.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );

  return (
    <div className={styles.productsPage}>
      {currentView === 'categories' ? renderCategoriesView() : renderProductsView()}

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className={styles.modalOverlay}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.modal}>
                <div className={styles.modalHeader}>
                   <h3>{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
                   <button onClick={() => setIsCategoryModalOpen(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleCategorySubmit} className={styles.modalBody}>
                   <div className={styles.inputGroup}>
                      <label>اسم القسم</label>
                      <input className={styles.input} value={categoryName} onChange={e => setCategoryName(e.target.value)} required />
                   </div>
                   <div className={styles.inputGroup}>
                      <label>صورة القسم</label>
                      <div className={styles.uploadArea}>
                         {imagePreview ? <img src={imagePreview} className={styles.preview} /> : <Upload size={32} />}
                         <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="cat-upload" />
                         <label htmlFor="cat-upload" className={styles.uploadLabel}>اختر صورة</label>
                      </div>
                   </div>
                   <div className={styles.modalFooter}>
                      <button type="button" onClick={() => setIsCategoryModalOpen(false)} className={styles.cancelBtn}>إلغاء</button>
                      <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>حفظ</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className={styles.modalOverlay}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.modal}>
                <div className={styles.modalHeader}>
                   <h3>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
                   <button onClick={() => setIsProductModalOpen(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleProductSubmit} className={styles.modalBody}>
                   <div className={styles.inputGroup}>
                      <label>اسم المنتج</label>
                      <input className={styles.input} value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} required />
                   </div>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>السعر</label>
                        <input type="number" className={styles.input} value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} required />
                      </div>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>الكمية</label>
                        <input type="number" className={styles.input} value={productFormData.stockCount} onChange={e => setProductFormData({...productFormData, stockCount: e.target.value})} required />
                      </div>
                   </div>
                   <div className={styles.inputGroup}>
                      <label>القسم</label>
                      <select className={styles.input} value={productFormData.category} onChange={e => setProductFormData({...productFormData, category: e.target.value})} required>
                         {(localCategories || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                   </div>
                   <div className={styles.inputGroup}>
                      <label>صورة المنتج</label>
                      <div className={styles.uploadArea}>
                         {imagePreview ? <img src={imagePreview} className={styles.preview} /> : <ImageIcon size={32} />}
                         <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="prod-upload" />
                         <label htmlFor="prod-upload" className={styles.uploadLabel}>اختر صورة</label>
                      </div>
                   </div>
                   <div className={styles.modalFooter}>
                      <button type="button" onClick={() => setIsProductModalOpen(false)} className={styles.cancelBtn}>إلغاء</button>
                      <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>حفظ</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
