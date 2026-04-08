import { db, storage } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Order } from './store';

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // Price before discount
  discountPrice?: number; // Actual selling price (if different)
  category: string;
  image: string;
  description?: string;
  storeSlug: string;
  options?: ProductOption[];
  stockCount: number;
  inStock: boolean;
  currency?: 'YER' | 'SAR' | 'USD';
}

export interface StoreInfo {
  slug: string;
  name: string;
  logo?: string;
  description?: string;
  phone: string;
  primaryColor?: string; // Custom store theme color
  secondaryColor?: string;
  currencySettings?: {
    default: string; // 'YER', 'SAR', 'USD'
    rates: { [key: string]: number }; // e.g. { 'USD': 530, 'SAR': 140 }
    useManualSARRate?: boolean;
    manualSARRate?: number;
  };
  seo?: {
    titleTemplate?: string;
    description?: string;
    keywords?: string[];
  };
  social?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  shippingFee?: number; // Fixed shipping fee controlled by merchant
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount?: number;
  expiryDate?: string;
  usageLimit?: number;
  usageCount: number;
  storeSlug: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  storeSlug: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isApproved: boolean;
}

export interface Category {
  id: string;
  name: string;
  image?: string; // Icon or Image for the category
  storeSlug: string;
}

const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro Max - 256GB',
    price: 1250000,
    originalPrice: 1350000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
    description: 'يتميز iPhone 15 Pro بتصميم من التيتانيوم القوي والخفيف، مع زر الإجراءات القابل للتخصيص، ونظام الكاميرا الأكثر تقدماً في iPhone حتى الآن.',
    storeSlug: 'demo',
    options: [
      { name: 'اللون', values: ['تيتانيوم طبيعي', 'تيتانيوم أزرق', 'تيتانيوم أسود'] }
    ],
    stockCount: 15,
    inStock: true
  },
  {
    id: 'sony-xm5',
    name: 'Sony WH-1000XM5 Headphones',
    price: 380000,
    originalPrice: 420000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1675243048035-9051873b624d?w=800&q=80',
    description: 'سماعات الرأس الرائدة عالمياً في إلغاء الضوضاء، تمنحك تجربة استماع غامرة ونقاء صوت لا يضاهى مع عمر بطارية يصل لـ 30 ساعة.',
    storeSlug: 'demo',
    stockCount: 8,
    inStock: true
  },
  {
    id: 'macbook-m3',
    name: 'MacBook Air M3 - 13 inch',
    price: 1100000,
    category: 'حواسيب',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    description: 'لابتوب نحيف وخفيف الوزن بشكل مذهل، وبقوة شريحة M3 الجديدة كلياً التي تمنحك سرعة فائقة وكفاءة عالية في إنجاز المهام.',
    storeSlug: 'demo',
    options: [
      { name: 'الذاكرة', values: ['8GB', '16GB', '24GB'] }
    ],
    stockCount: 0,
    inStock: false
  },
  {
    id: 'yemeni-honey',
    name: 'عسل سدر ملكي فاخر دوعني',
    price: 45000,
    category: 'منتجات محلية',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
    description: 'عسل سدر يمني طبيعي 100% من وادي دوعن، يتميز بطعمه الفريد وخصائصه العلاجية النادرة وجودته العالية جداً.',
    storeSlug: 'demo',
    options: [
      { name: 'الحجم', values: ['500 جرام', '1 كيلوجرام'] }
    ],
    stockCount: 50,
    inStock: true
  },
  {
    id: 'playstation-5',
    name: 'PlayStation 5 Console',
    price: 550000,
    originalPrice: 600000,
    category: 'ألعاب',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80',
    description: 'انطلق في مغامرات لا حدود لها مع منصة الألعاب الأقوى في العالم، والتي توفر تجربة لعب بدقة 4K وسرعات تحميل فائقة.',
    storeSlug: 'demo',
    stockCount: 5,
    inStock: true
  },
  {
    id: 'al-kbous-coffee',
    name: 'قهوة الكبوس - خلطة عربية',
    price: 1500,
    category: 'منتجات محلية',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    description: 'قهوة الكبوس الشهيرة بعبقها الأصيل ونكهتها الغنية التي تعكس تراث القهوة اليمنية وتمنحك بداية يوم مثالية.',
    storeSlug: 'demo',
    stockCount: 100,
    inStock: true
  }
];

export const DUMMY_STORES: StoreInfo[] = [
  {
    slug: 'boun',
    name: 'متجر بون (سعيد)',
    logo: 'https://cdn-icons-png.flaticon.com/512/3120/3120516.png',
    phone: '967771234567',
    description: 'أجود أنواع القهوة المختصة لمتذوقي الطعم الأصيل.',
    primaryColor: '#6F4E37',
    social: { instagram: 'boun_coffee' }
  },
  {
    slug: 'smart-phone',
    name: 'سمارت فون (صالح)',
    logo: 'https://cdn-icons-png.flaticon.com/512/2586/2586488.png',
    phone: '967777777777',
    description: 'عالمك المتكامل لأحدث الهواتف الذكية والإكسسوارات.',
    primaryColor: '#007AFF',
    social: { twitter: 'smart_tech' }
  },
  {
    slug: 'demo',
    name: 'متجر بايرز التجريبي',
    logo: 'https://cdn-icons-png.flaticon.com/512/1162/1162456.png',
    phone: '967770000000',
    description: 'أفضل المنتجات العالمية والمحلية في مكان واحد.',
    social: {
      instagram: 'buyers_ye',
      twitter: 'buyers_ye',
      facebook: 'buyers_ye'
    }
  }
];

// Fetch all products for a specific store
export async function getStoreProducts(storeSlug: string): Promise<Product[]> {
  if (storeSlug === 'demo') {
    return DUMMY_PRODUCTS;
  }

  try {
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    return productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
      .filter(p => p.storeSlug === storeSlug);
  } catch (error) {
    console.error("Error fetching products:", error);
    return DUMMY_PRODUCTS;
  }
}

// Fetch single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  const dummyProduct = DUMMY_PRODUCTS.find(p => p.id === id);
  if (dummyProduct) return dummyProduct;
  
  try {
    const productDoc = doc(db, 'products', id);
    const productSnap = await getDoc(productDoc);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Fetch store metadata
export async function getStoreInfo(slug: string): Promise<StoreInfo | null> {
  const dummyStore = DUMMY_STORES.find(s => s.slug === slug);
  try {
    const storeDoc = doc(db, 'stores', slug);
    const storeSnap = await getDoc(storeDoc);
    if (storeSnap.exists()) {
      return { slug: storeSnap.id, ...storeSnap.data() } as StoreInfo;
    }
    return dummyStore || null;
  } catch (error) {
    console.error("Error fetching store info:", error);
    return dummyStore || null;
  }
}

// Fetch related products
export async function getRelatedProducts(category: string, excludeId: string, storeSlug: string = 'demo', limit: number = 4): Promise<Product[]> {
  const allProducts = await getStoreProducts(storeSlug); 
  return allProducts
    .filter(p => p.category === category && p.id !== excludeId)
    .slice(0, limit);
}

// --- MERCHANT API ---

export async function uploadProductImage(file: File, storeSlug: string): Promise<string> {
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `stores/${storeSlug}/products/${fileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export async function uploadStoreLogo(file: File, storeSlug: string): Promise<string> {
  const fileName = `${Date.now()}_logo_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `stores/${storeSlug}/logo/${fileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export async function uploadCategoryImage(file: File, storeSlug: string): Promise<string> {
  const fileName = `${Date.now()}_cat_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `stores/${storeSlug}/categories/${fileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export async function getStoreCategories(storeSlug: string): Promise<Category[]> {
  try {
    const categoriesCol = collection(db, 'stores', storeSlug, 'categories');
    const categorySnapshot = await getDocs(categoriesCol);
    return categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getStoreCoupons(storeSlug: string): Promise<Coupon[]> {
  const couponsRef = collection(db, 'stores', storeSlug, 'coupons');
  const q = query(couponsRef, orderBy('id', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Coupon);
}

export async function addCoupon(coupon: Omit<Coupon, 'id' | 'usageCount' | 'isActive'>): Promise<string> {
  const id = `cpn_${Date.now()}`;
  const newCoupon: Coupon = { ...coupon, id, usageCount: 0, isActive: true };
  await setDoc(doc(db, 'stores', coupon.storeSlug, 'coupons', id), newCoupon);
  return id;
}

export async function updateCoupon(storeSlug: string, id: string, data: Partial<Coupon>): Promise<void> {
  const couponRef = doc(db, 'stores', storeSlug, 'coupons', id);
  await updateDoc(couponRef, data);
}

export async function deleteCoupon(storeSlug: string, id: string): Promise<void> {
  const couponRef = doc(db, 'stores', storeSlug, 'coupons', id);
  await deleteDoc(couponRef);
}

export async function getStoreReviews(storeSlug: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, 'stores', storeSlug, 'reviews');
    const q = query(reviewsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Review);
  } catch (error) {
    return [];
  }
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  const categoriesCol = collection(db, 'stores', category.storeSlug, 'categories');
  const docRef = doc(categoriesCol);
  const newCategory = { ...category, id: docRef.id };
  await setDoc(docRef, newCategory);
  return newCategory.id;
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const productsCol = collection(db, 'products');
  const docRef = doc(productsCol);
  const newProduct = { ...product, id: docRef.id };
  await setDoc(doc(db, 'products', newProduct.id), newProduct);
  return newProduct.id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const productRef = doc(db, 'products', id);
  await updateDoc(productRef, updates as any);
}

export async function deleteProduct(id: string): Promise<void> {
  const productRef = doc(db, 'products', id);
  await deleteDoc(productRef);
}

export async function getStoreOrders(storeSlug: string): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCol);
    return orderSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order))
      .filter(o => o.items.some(item => (item as any).storeSlug === storeSlug || storeSlug === 'demo'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { status });
}

export async function updateStoreInfo(slug: string, updates: Partial<StoreInfo>): Promise<void> {
  const storeRef = doc(db, 'stores', slug);
  await setDoc(storeRef, updates, { merge: true });
}

// --- GLOBAL PLATFORM API ---

export async function getAllStores(): Promise<StoreInfo[]> {
  try {
    const storesCol = collection(db, 'stores');
    const storeSnapshot = await getDocs(storesCol);
    const dbStores = storeSnapshot.docs.map(doc => ({ ...doc.data(), slug: doc.id } as StoreInfo));
    const allSlugs = new Set([...dbStores.map(s => s.slug), ...DUMMY_STORES.map(s => s.slug)]);
    return Array.from(allSlugs).map(slug => {
       return dbStores.find(s => s.slug === slug) || DUMMY_STORES.find(s => s.slug === slug)!;
    });
  } catch (error) {
    return DUMMY_STORES;
  }
}

export async function getAllPlatformOrders(): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCol);
    return orderSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    return [];
  }
}

export async function getAllPlatformReviews(): Promise<Review[]> {
  try {
    const stores = await getAllStores();
    const reviewPromises = stores.map(store => getStoreReviews(store.slug));
    const reviewsArrays = await Promise.all(reviewPromises);
    return reviewsArrays.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    return [];
  }
}
