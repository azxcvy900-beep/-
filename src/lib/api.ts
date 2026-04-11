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
  writeBatch,
  collectionGroup,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Order } from './store';
export type { Order };
import { dataCache } from './cache';

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
  heroBanner?: string; // High-quality promotional banner
  heroBanners?: { image: string; title: string; subtitle: string }[];
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
    whatsapp?: string;
  };
  shippingFee?: number; // Fixed shipping fee controlled by merchant
  merchantId?: string; // Firebase UID of the merchant who owns this store
  planType?: 'free' | 'pro' | 'business';
  subscriptionStatus?: 'active' | 'expired' | 'pending_verification';
  orderCountMonth?: number;
  lastCountReset?: string;
}

export interface PaymentProof {
  id: string;
  storeSlug: string;
  merchantId: string;
  amount: number;
  plan: 'pro' | 'business';
  imageUrl: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
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
  // --- Smartphones Section ---
  {
    id: 'iphone-12-clean',
    name: 'iPhone 12 - 128GB (مستخدم نظيف)',
    price: 1450,
    originalPrice: 1600,
    category: 'هواتف ذكية',
    image: '/assets/demo/iphone_15.png',
    description: 'آيفون 12 بحالة ممتازة، بطارية فوق 90%، ضمان فحص وتجربة. الأداء القوي بسعر منافس.',
    storeSlug: 'demo',
    options: [{ name: 'اللون', values: ['أزرق', 'أسود', 'أبيض'] }],
    stockCount: 5, inStock: true
  },
  {
    id: 'samsung-s24-demo',
    name: 'Samsung Galaxy S24 (نسخة ديمو)',
    price: 1750,
    originalPrice: 1800,
    category: 'هواتف ذكية',
    image: '/assets/demo/samsung_s24.png',
    description: 'أقوى أداء من سامسونج مع معالج سناب دراجون، شاشة مذهلة وكاميرا احترافية بسعر العرض.',
    storeSlug: 'demo',
    stockCount: 3, inStock: true
  },
  {
    id: 'lt-m50-plus',
    name: 'LT M50 Plus - 256GB/16GB',
    price: 640,
    originalPrice: 700,
    category: 'هواتف ذكية',
    image: '/assets/demo/lt_m50.png',
    description: 'الهاتف اليمني الأول يدعم نظامين، شاشة 120Hz، بطارية ضخمة وأداء سلس جداً في التطبيقات والألعاب.',
    storeSlug: 'demo',
    stockCount: 45, inStock: true
  },
  {
    id: 'redmi-note-13-pro',
    name: 'Redmi Note 13 Pro 4G - 256GB',
    price: 920,
    originalPrice: 980,
    category: 'هواتف ذكية',
    image: '/assets/demo/redmi_note_13.png',
    description: 'كاميرا 200 ميجابكسل، شاشة AMOLED مذهلة، وشحن سريع جداً. القوة الحقيقية في الفئة المتوسطة.',
    storeSlug: 'demo',
    stockCount: 30, inStock: true
  },
  {
    id: 'samsung-a55',
    name: 'Samsung Galaxy A55 5G - 128GB',
    price: 1280,
    category: 'هواتف ذكية',
    image: '/assets/demo/samsung_a55.png',
    description: 'تصميم زجاجي فاخر، مقاوم للماء والغبار، أداء قوي وكاميرات رائعة لمن يبحث عن الجودة والاستقرار.',
    storeSlug: 'demo',
    stockCount: 20, inStock: true
  },
  {
    id: 'lt-note-20',
    name: 'LT Note 20 Pro - 128GB',
    price: 490,
    category: 'هواتف ذكية',
    image: '/assets/demo/lt_note_20.png',
    description: 'أناقة الـ Note وقوة الـ LT. جوال مثالي للعمل والدراسة مع ضمان محلي معتمد.',
    storeSlug: 'demo',
    stockCount: 25, inStock: true
  },
  
  // --- Audio & Accessories Section ---
  {
    id: 'airpods-pro-2',
    name: 'Apple AirPods Pro 2 (أصلي)',
    price: 850,
    originalPrice: 950,
    category: 'سماعات وإكسسوارات',
    image: '/assets/demo/airpods.png',
    description: 'أفضل تجربة عزل ضوضاء في العالم مع نقاء صوت لا يوصف وتكامل تام مع نظام Apple.',
    storeSlug: 'demo',
    stockCount: 12, inStock: true
  },
  {
    id: 'redmi-buds-5-pro',
    name: 'Redmi Buds 5 Pro - Global',
    price: 115,
    category: 'سماعات وإكسسوارات',
    image: '/assets/demo/redmi_buds.png',
    description: 'عزل ضوضاء ذكي، بطارية تدوم طويلاً، وجودة صوت تنافس السماعات الرائدة بسعر مغري.',
    storeSlug: 'demo',
    stockCount: 40, inStock: true
  },
  {
    id: 'anker-65w',
    name: 'Anker Nano II 65W Fast Charger',
    price: 140,
    category: 'سماعات وإكسسوارات',
    image: 'https://images.unsplash.com/photo-1619130730344-f2a75936a827?w=800&q=80',
    description: 'شاحن صغير الحجم فائق القوة، يشحن جوالك ولابتوبك بسرعة فائقة بأمان تام.',
    storeSlug: 'demo',
    stockCount: 60, inStock: true
  },
  {
    id: 'iphone-case',
    name: 'كفر حماية فخم للايفون',
    price: 25,
    category: 'سماعات وإكسسوارات',
    image: 'https://images.unsplash.com/photo-1603313011101-31c72ee78242?w=800&q=80',
    description: 'حماية كاملة من الصدمات بتصميم أنيق وخامات عالية الجودة.',
    storeSlug: 'demo',
    stockCount: 100, inStock: true
  },
  {
    id: 'screen-protector',
    name: 'لاصق حماية زجاجي (Original)',
    price: 10,
    category: 'سماعات وإكسسوارات',
    image: 'https://images.unsplash.com/photo-1616423641322-96b6f7e8a93e?w=800&q=80',
    description: 'حماية فائقة لشاشة هاتفك من الكسر والخدوش بدقة ووضوح عالي.',
    storeSlug: 'demo',
    stockCount: 200, inStock: true
  },

  // --- Gaming Section ---
  {
    id: 'ps5-slim-sale',
    name: 'PlayStation 5 Slim (عرض محدود)',
    price: 1780,
    originalPrice: 1850,
    category: 'أجهزة ألعاب',
    image: '/assets/demo/ps5.png',
    description: 'عالم الألعاب القادم بين يديك بدقة 4K وسرعة تحميل فورية وتصميم نحيف جديد.',
    storeSlug: 'demo',
    stockCount: 2, inStock: true
  },
  {
    id: 'game-card',
    name: 'بطاقة شدات / رصيد ألعاب',
    price: 45,
    category: 'أجهزة ألعاب',
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80',
    description: 'اشحن رصيدك فوراً وابدأ اللعب والاستمتاع بمميزات متقدمة.',
    storeSlug: 'demo',
    stockCount: 500, inStock: true
  },

  // --- Computers Section ---
  {
    id: 'ipad-air-4',
    name: 'iPad Air (الجيل الرابع) - 64GB',
    price: 1650,
    category: 'حواسيب',
    image: '/assets/demo/macbook.png',
    description: 'مثالي للدراسة والتصميم مع شاشة مذهلة ودعم قلم أبل. أداء اللابتوب في حجم التابلت.',
    storeSlug: 'demo',
    stockCount: 4, inStock: true
  },
  {
    id: 'redmi-pad-se',
    name: 'Redmi Pad SE - 11 inch',
    price: 820,
    category: 'حواسيب',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    description: 'تابلت عملي جداً لمشاهدة الأفلام والدراسة، بطارية تدوم طويلاً وشاشة FHD.',
    storeSlug: 'demo',
    stockCount: 15, inStock: true
  }
];

export const DUMMY_STORES: StoreInfo[] = [
  {
    slug: 'yemen-digital',
    name: 'يمن ديجيتال - Yemen Digital',
    logo: '/assets/demo/logo.png',
    heroBanner: '/assets/demo/banner.png',
    heroBanners: [
      { image: '/assets/demo/banner.png', title: 'عالم الهواتف الذكية', subtitle: 'أحدث الابتكارات بين يديك' },
      { image: 'https://images.unsplash.com/photo-1621336304646-6fc1473ae74b?w=2000&q=80', title: 'عالم الألعاب', subtitle: 'انغمس في التجربة مع PS5' },
      { image: 'https://images.unsplash.com/photo-1618366712214-8c075189d0ad?w=2000&q=80', title: 'صوت مذهل', subtitle: 'استمتع بنقاوة الصوت مع AirPods Pro' }
    ],
    phone: '967771234567',
    description: 'وجهتك الأولى لأحدث التقنيات بأسعار منافسة في اليمن.',
    primaryColor: '#007AFF',
    currencySettings: {
      default: 'SAR',
      rates: { 'YER': 530, 'USD': 3.75 }
    },
    social: { instagram: 'yemen_digital', whatsapp: '967771234567' }
  },
  {
    slug: 'demo',
    name: 'يمن ديجيتال (ديمو)',
    logo: '/assets/demo/logo.png',
    heroBanner: '/assets/demo/banner.png',
    heroBanners: [
      { image: '/assets/demo/banner.png', title: 'عالم الهواتف الذكية', subtitle: 'أحدث الابتكارات بين يديك' },
      { image: 'https://images.unsplash.com/photo-1621336304646-6fc1473ae74b?w=2000&q=80', title: 'عالم الألعاب', subtitle: 'انغمس في التجربة مع PS5' },
      { image: 'https://images.unsplash.com/photo-1618366712214-8c075189d0ad?w=2000&q=80', title: 'صوت مذهل', subtitle: 'استمتع بنقاوة الصوت مع AirPods Pro' }
    ],
    phone: '967770000000',
    description: 'استكشف قوة منصة بايرز بنظام تسعير الريال السعودي (رس).',
    currencySettings: {
      default: 'SAR',
      rates: { 'YER': 530, 'USD': 3.75 }
    },
    social: {
      instagram: 'buyers_ye',
      twitter: 'buyers_ye',
      facebook: 'buyers_ye'
    }
  }
];

// Fetch all products for a specific store (cached for 2 minutes)
export async function getStoreProducts(storeSlug: string): Promise<Product[]> {
  if (storeSlug === 'demo') {
    return DUMMY_PRODUCTS;
  }

  const cacheKey = `products_${storeSlug}`;
  const cached = dataCache.get<Product[]>(cacheKey);
  if (cached) return cached;

  try {
    const productsCol = collection(db, 'products');
    const q = query(productsCol, where('storeSlug', '==', storeSlug));
    const productSnapshot = await getDocs(q);
    const products = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    dataCache.set(cacheKey, products, 120);
    return products;
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

// Fetch store metadata (cached for 5 minutes)
export async function getStoreInfo(slug: string): Promise<StoreInfo | null> {
  if (!slug) return null;
  const cacheKey = `store_${slug}`;
  const cached = dataCache.get<StoreInfo | null>(cacheKey);
  if (cached !== null) return cached;

  const dummyStore = DUMMY_STORES.find(s => s.slug === slug);
  try {
    const storeDoc = doc(db, 'stores', slug);
    const storeSnap = await getDoc(storeDoc);
    if (storeSnap.exists()) {
      const result = { slug: storeSnap.id, ...storeSnap.data() } as StoreInfo;
      dataCache.set(cacheKey, result, 300);
      return result;
    }
    dataCache.set(cacheKey, dummyStore || null, 300);
    return dummyStore || null;
  } catch (error) {
    console.error("Error fetching store info:", error);
    return dummyStore || null;
  }
}

// Get store by merchant UID
export async function getStoreByMerchant(uid: string): Promise<StoreInfo | null> {
  if (!uid) return null;
  
  const cacheKey = `merchant_store_${uid}`;
  const cached = dataCache.get<StoreInfo | null>(cacheKey);
  if (cached) return cached;

  try {
    const storesCol = collection(db, 'stores');
    const q = query(storesCol, where('merchantId', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const result = { slug: doc.id, ...doc.data() } as StoreInfo;
      dataCache.set(cacheKey, result, 600); // Cache for 10 mins
      return result;
    }
    
    // Fallback: search dummy stores (if any has demo user ID - not needed for prod but helpful for dev)
    return DUMMY_STORES.find(s => (s as any).merchantId === uid) || null;
  } catch (error) {
    console.error("Error fetching store by merchant:", error);
    return null;
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

export async function uploadProductImage(file: File | Blob, storeSlug: string): Promise<string> {
  try {
    const originalName = (file as any).name || 'product.jpg';
    const fileName = `${Date.now()}_prod_${originalName.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `stores/${storeSlug}/products/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Storage Error (Product Image):", error);
    throw error;
  }
}

export async function uploadStoreLogo(file: File | Blob, storeSlug: string): Promise<string> {
  try {
    const originalName = (file as any).name || 'logo.jpg';
    const fileName = `${Date.now()}_logo_${originalName.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `stores/${storeSlug}/logo/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Storage Error (Store Logo):", error);
    throw error;
  }
}

export async function uploadCategoryImage(file: File | Blob, storeSlug: string): Promise<string> {
  try {
    const originalName = (file as any).name || 'category.jpg';
    const fileName = `${Date.now()}_cat_${originalName.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `stores/${storeSlug}/categories/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Storage Error (Category Image):", error);
    throw error;
  }
}

export async function getStoreCategories(storeSlug: string): Promise<Category[]> {
  if (storeSlug === 'demo') {
    return [
      { id: 'cat-phones', name: 'هواتف ذكية', storeSlug: 'demo', image: '/assets/demo/iphone_15.png' },
      { id: 'cat-audio', name: 'سماعات وإكسسوارات', storeSlug: 'demo', image: '/assets/demo/airpods.png' },
      { id: 'cat-gaming', name: 'أجهزة ألعاب', storeSlug: 'demo', image: '/assets/demo/ps5.png' },
      { id: 'cat-computers', name: 'حواسيب', storeSlug: 'demo', image: '/assets/demo/macbook.png' },
    ];
  }

  const cacheKey = `categories_${storeSlug}`;
  const cached = dataCache.get<Category[]>(cacheKey);
  if (cached) return cached;

  try {
    const categoriesCol = collection(db, 'stores', storeSlug, 'categories');
    const categorySnapshot = await getDocs(categoriesCol);
    const categories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    dataCache.set(cacheKey, categories, 120);
    return categories;
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

export async function validateCoupon(storeSlug: string, code: string, totalAmount?: number): Promise<Coupon | null> {
  try {
    const couponsRef = collection(db, 'stores', storeSlug, 'coupons');
    const q = query(couponsRef, where('code', '==', code.toUpperCase()), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const coupon = querySnapshot.docs[0].data() as Coupon;
    
    if (totalAmount !== undefined && coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
      return null;
    }
    
    return coupon;
  } catch (error) {
    return null;
  }
}

export type AnalyticsData = {
  date: string;
  sales: number;
  orders: number;
};

export async function getStoreAnalyticsData(storeSlug: string, period: 'day' | 'week' | 'month' = 'month'): Promise<AnalyticsData[]> {
  try {
    const orders = await getStoreOrders(storeSlug);
    const now = new Date();
    const dataMap: Record<string, AnalyticsData> = {};
    
    // Filter and aggregate orders based on period
    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (period === 'day') return diffDays <= 1;
      if (period === 'week') return diffDays <= 7;
      return diffDays <= 30; // default month
    });

    filteredOrders.forEach(order => {
      const dateKey = new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dataMap[dateKey]) {
        dataMap[dateKey] = { date: dateKey, sales: 0, orders: 0 };
      }
      dataMap[dateKey].sales += order.total;
      dataMap[dateKey].orders += 1;
    });

    return Object.values(dataMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    return [];
  }
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

export async function getProductReviews(storeSlug: string, productId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, 'stores', storeSlug, 'reviews');
    const q = query(reviewsRef, where('productId', '==', productId), where('isApproved', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Review);
  } catch (error) {
    return [];
  }
}

export async function addReview(review: Omit<Review, 'id' | 'date' | 'isApproved'>): Promise<string> {
  const id = `rev_${Date.now()}`;
  const newReview: Review = {
    ...review,
    id,
    date: new Date().toISOString(),
    isApproved: true
  };
  await setDoc(doc(db, 'stores', review.storeSlug, 'reviews', id), newReview);
  return id;
}

export async function updateReviewStatus(storeSlug: string, id: string, isApproved: boolean): Promise<void> {
  const reviewRef = doc(db, 'stores', storeSlug, 'reviews', id);
  await updateDoc(reviewRef, { isApproved });
}

export async function deleteReview(storeSlug: string, id: string): Promise<void> {
  const reviewRef = doc(db, 'stores', storeSlug, 'reviews', id);
  await deleteDoc(reviewRef);
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  const categoriesCol = collection(db, 'stores', category.storeSlug, 'categories');
  const docRef = doc(categoriesCol);
  const newCategory = { ...category, id: docRef.id };
  await setDoc(docRef, newCategory);
  dataCache.invalidate(`categories_${category.storeSlug}`);
  return newCategory.id;
}

export async function updateCategory(storeSlug: string, id: string, data: Partial<Category>): Promise<void> {
  const catRef = doc(db, 'stores', storeSlug, 'categories', id);
  await updateDoc(catRef, data);
  dataCache.invalidate(`categories_${storeSlug}`);
}

export async function deleteCategory(storeSlug: string, id: string): Promise<void> {
  const catRef = doc(db, 'stores', storeSlug, 'categories', id);
  await deleteDoc(catRef);
  dataCache.invalidate(`categories_${storeSlug}`);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const productsCol = collection(db, 'products');
  const docRef = doc(productsCol);
  const newProduct = { ...product, id: docRef.id };
  await setDoc(doc(db, 'products', newProduct.id), newProduct);
  dataCache.invalidatePrefix('products_');
  return newProduct.id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const productRef = doc(db, 'products', id);
  await updateDoc(productRef, updates as any);
  dataCache.invalidatePrefix('products_');
}

export async function deleteProduct(id: string): Promise<void> {
  const productRef = doc(db, 'products', id);
  await deleteDoc(productRef);
  dataCache.invalidatePrefix('products_');
}

export async function getStoreOrders(storeSlug: string): Promise<Order[]> {
  const cacheKey = `orders_${storeSlug}`;
  const cached = dataCache.get<Order[]>(cacheKey);
  if (cached) return cached;

  try {
    const ordersCol = collection(db, 'orders');
    // For merchant, we might need a composite index if we query by multiple fields
    // but a simple filter followed by manual sort is safer if indices aren't ready
    const orderSnapshot = await getDocs(ordersCol);
    const orders = orderSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order))
      .filter(o => o.items.some(item => (item as any).storeSlug === storeSlug || storeSlug === 'demo'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    dataCache.set(cacheKey, orders, 60);
    return orders;
  } catch (error) {
    return [];
  }
}

// Real-time subscription for orders
export function subscribeToStoreOrders(storeSlug: string, callback: (orders: Order[]) => void) {
  const ordersCol = collection(db, 'orders');
  
  return onSnapshot(ordersCol, (snapshot) => {
    const orders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order))
      .filter(o => o.items.some(item => (item as any).storeSlug === storeSlug || storeSlug === 'demo'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    dataCache.set(`orders_${storeSlug}`, orders, 60);
    callback(orders);
  });
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { status });
}

export async function updateStoreInfo(slug: string, updates: Partial<StoreInfo>): Promise<void> {
  try {
    const storeRef = doc(db, 'stores', slug);
    
    // Sanitize: Firestore doesn't accept 'undefined'. Convert to null or remove.
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await setDoc(storeRef, sanitizedUpdates, { merge: true });
    // Clear cache to ensure the new info is refetched immediately
    dataCache.invalidate(`store_${slug}`);
  } catch (error) {
    console.error("Firestore Error (Update Store):", error);
    throw error;
  }
}

export async function incrementStoreOrderCount(slug: string): Promise<void> {
  if (slug === 'demo') return;
  const storeRef = doc(db, 'stores', slug);
  const storeSnap = await getDoc(storeRef);
  
  if (storeSnap.exists()) {
    const data = storeSnap.data();
    const currentCount = data.orderCountMonth || 0;
    const now = new Date();
    const lastReset = data.lastCountReset ? new Date(data.lastCountReset) : null;
    
    // Auto-reset count if it's a new month
    const isNewMonth = !lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
    
    await updateDoc(storeRef, {
      orderCountMonth: isNewMonth ? 1 : currentCount + 1,
      lastCountReset: now.toISOString()
    });
  }
}

/**
 * Submit a new order to Firestore and update customer CRM.
 */
export async function submitOrder(order: Order, storeSlug: string): Promise<void> {
  // 0. Final Inventory Guard: Verify all items are in stock
  for (const item of order.items) {
    const productRef = doc(db, 'products', item.id);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) continue;
    
    const prodData = productSnap.data();
    if ((prodData.stockCount || 0) < item.quantity) {
      throw new Error(`out_of_stock:${item.name}`);
    }
  }

  const orderRef = doc(db, 'orders', order.id);
  
  // 1. Save order to Firestore
  await setDoc(orderRef, {
    ...order,
    storeSlug, // Ensure storeSlug is correctly indexed
  });

  // 2. Increment store usage counter
  await incrementStoreOrderCount(storeSlug);

  // 3. Save/Update customer info in store's CRM
  await saveCustomerInfo({
    name: order.address.fullName,
    phone: order.address.phone,
    storeSlug: storeSlug,
    lastOrderDate: order.date,
  });

  // 4. Automated Inventory Decrement
  for (const item of order.items) {
    try {
      const productRef = doc(db, 'products', item.id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const prodData = productSnap.data();
        const currentStock = prodData.stockCount || 0;
        // Decrement stock, but don't go below 0
        const newStock = Math.max(0, currentStock - item.quantity);
        await updateDoc(productRef, { stockCount: newStock });
      }
    } catch (err) {
      console.error(`Failed to decrement stock for item ${item.id}:`, err);
    }
  }
}

export async function submitPaymentProof(proof: Omit<PaymentProof, 'id' | 'date' | 'status'>): Promise<string> {
  const id = `pay_${Date.now()}`;
  const newProof: PaymentProof = {
    ...proof,
    id,
    date: new Date().toISOString(),
    status: 'pending'
  };
  
  await setDoc(doc(db, 'platform', 'payments', 'proofs', id), newProof);
  
  // Also update store status to pending
  await updateStoreInfo(proof.storeSlug, { subscriptionStatus: 'pending_verification' });
  
  return id;
}

export async function getStoreAnalytics(slug: string) {
  // Placeholder for advanced aggregation logic
  // Will return monthly sales data for Recharts
  return [
    { name: 'السبت', sales: 4000 },
    { name: 'الأحد', sales: 3000 },
    { name: 'الاثنين', sales: 2000 },
    { name: 'الثلاثاء', sales: 2780 },
    { name: 'الأربعاء', sales: 1890 },
    { name: 'الخميس', sales: 2390 },
    { name: 'الجمعة', sales: 3490 },
  ];
}

// --- GLOBAL PLATFORM API ---

export interface PlatformSettings {
  platformFee: number;
  maintenanceMode: boolean;
  defaultCurrency: string;
  currencyRates: {
    YER: number;
    SAR: number;
    [key: string]: number;
  };
  notifications: {
    newMerchant: boolean;
    highComplaint: boolean;
    systemAlert: boolean;
  };
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const defaultSettings: PlatformSettings = {
    platformFee: 2.5,
    maintenanceMode: false,
    defaultCurrency: 'USD',
    currencyRates: {
      YER: 530,
      SAR: 140
    },
    notifications: {
      newMerchant: true,
      highComplaint: true,
      systemAlert: true
    }
  };

  try {
    const settingsDoc = doc(db, 'platform', 'config');
    const settingsSnap = await getDoc(settingsDoc);
    if (settingsSnap.exists()) {
      return settingsSnap.data() as PlatformSettings;
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return defaultSettings;
  }
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
  const settingsDoc = doc(db, 'platform', 'config');
  await setDoc(settingsDoc, settings, { merge: true });
}

export async function getAllStores(): Promise<StoreInfo[]> {
  const cacheKey = 'all_stores';
  const cached = dataCache.get<StoreInfo[]>(cacheKey);
  if (cached) return cached;

  try {
    const storesCol = collection(db, 'stores');
    const storeSnapshot = await getDocs(storesCol);
    const dbStores = storeSnapshot.docs.map(doc => ({ ...doc.data(), slug: doc.id } as StoreInfo));
    const allSlugs = new Set([...dbStores.map(s => s.slug), ...DUMMY_STORES.map(s => s.slug)]);
    const result = Array.from(allSlugs).map(slug => {
       return dbStores.find(s => s.slug === slug) || DUMMY_STORES.find(s => s.slug === slug)!;
    });
    dataCache.set(cacheKey, result, 120);
    return result;
  } catch (error) {
    return DUMMY_STORES;
  }
}

export async function getAllPlatformOrders(): Promise<Order[]> {
  const cacheKey = 'all_orders';
  const cached = dataCache.get<Order[]>(cacheKey);
  if (cached) return cached;

  try {
    const ordersCol = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCol);
    const orders = orderSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    dataCache.set(cacheKey, orders, 30);
    return orders;
  } catch (error) {
    return [];
  }
}

export async function getAllPlatformReviews(): Promise<Review[]> {
  try {
    const reviewsRef = collectionGroup(db, 'reviews');
    const q = query(reviewsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Review);
  } catch (error) {
    console.error("CollectionGroup query failed (check if index is required):", error);
    // Fallback if index is not created yet
    const stores = await getAllStores();
    const reviewPromises = stores.map(store => getStoreReviews(store.slug));
    const reviewsArrays = await Promise.all(reviewPromises);
    return reviewsArrays.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export async function seedDatabase(): Promise<void> {
  const batch = writeBatch(db);
  for (const store of DUMMY_STORES) {
    const storeRef = doc(db, 'stores', store.slug);
    batch.set(storeRef, store);
  }
  for (const product of DUMMY_PRODUCTS) {
    const productRef = doc(db, 'products', product.id);
    batch.set(productRef, product);
  }
  
  // Also seed initial platform settings
  const settingsRef = doc(db, 'platform', 'config');
  batch.set(settingsRef, {
    platformFee: 2.5,
    maintenanceMode: false,
    defaultCurrency: 'USD',
    currencyRates: {
      YER: 530,
      SAR: 140
    },
    notifications: {
      newMerchant: true,
      highComplaint: true,
      systemAlert: true
    }
  });

  await batch.commit();
}
// --- MERCHANT IDENTITY API ---

// --- USER & PERMISSIONS ---

export type UserRole = 'admin' | 'merchant' | 'employee' | null;

export interface AppUser {
  uid: string;
  username: string;
  password?: string;
  email?: string;
  storeSlug?: string;
  role: UserRole;
  permissions?: string[]; // e.g. ['orders.view', 'products.edit']
  createdAt: string;
}

export interface Customer {
  id: string; // Phone or Email
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  storeSlug: string;
}

/**
 * Register a new merchant in Firestore.
 */
export async function registerMerchant(merchant: Omit<AppUser, 'uid' | 'createdAt' | 'role' | 'permissions'>): Promise<string> {
  const isAvailable = await checkUsernameAvailability(merchant.username);
  if (!isAvailable) throw new Error('username_taken');

  const uid = `mcht_${Date.now()}`;
  const newUser: AppUser = {
    ...merchant,
    uid,
    role: 'merchant',
    permissions: ['all'], // Owners have all permissions
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'merchants', merchant.username.toLowerCase()), newUser);
  return uid;
}

/**
 * Validate user credentials against Firestore.
 */
export async function loginMerchant(username: string, password: string): Promise<AppUser | null> {
  try {
    const userRef = doc(db, 'merchants', username.toLowerCase());
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data() as AppUser;
      if (data.password === password) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const merchantDoc = doc(db, 'merchants', username.toLowerCase());
    const merchantSnap = await getDoc(merchantDoc);
    return !merchantSnap.exists();
  } catch (error: any) {
    console.error("Non-fatal error checking username availability:", error);
    // If permission is denied (unauthenticated check), we don't assume it's taken.
    // The final setDoc in registerMerchant will throw a real error if there's a collision.
    return true; 
  }
}

/**
 * Update user profile (e.g. link a storeSlug after setup).
 */
export async function updateMerchant(username: string, updates: Partial<AppUser>): Promise<void> {
  const userRef = doc(db, 'merchants', username.toLowerCase());
  await updateDoc(userRef, updates);
}

/**
 * Add a new employee to a store.
 */
export async function addEmployee(employee: Omit<AppUser, 'uid' | 'createdAt' | 'role'>, storeSlug: string): Promise<string> {
  const isAvailable = await checkUsernameAvailability(employee.username);
  if (!isAvailable) throw new Error('username_taken');

  const uid = `emp_${Date.now()}`;
  const newUser: AppUser = {
    ...employee,
    uid,
    role: 'employee',
    storeSlug,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'merchants', employee.username.toLowerCase()), newUser);
  return uid;
}

/**
 * Get all employees for a specific store.
 */
export async function getStoreEmployees(storeSlug: string): Promise<AppUser[]> {
  const usersRef = collection(db, 'merchants');
  const q = query(usersRef, where('storeSlug', '==', storeSlug), where('role', '==', 'employee'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AppUser);
}

/**
 * Get all customers for a specific store.
 */
export async function getStoreCustomers(storeSlug: string): Promise<Customer[]> {
  try {
    const customersRef = collection(db, 'stores', storeSlug, 'customers');
    const q = query(customersRef, orderBy('lastOrderDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Customer);
  } catch (error) {
    return [];
  }
}

/**
 * Save or update customer info when an order is placed.
 */
export async function saveCustomerInfo(customerData: Omit<Customer, 'totalOrders' | 'totalSpent' | 'id'>): Promise<void> {
  const customerId = customerData.phone; // Use phone as unique ID
  const customerRef = doc(db, 'stores', customerData.storeSlug, 'customers', customerId);
  const snap = await getDoc(customerRef);

  if (snap.exists()) {
    const existing = snap.data() as Customer;
    await updateDoc(customerRef, {
      totalOrders: existing.totalOrders + 1,
      totalSpent: existing.totalSpent + (existing as any).lastOrderTotal || 0,
      lastOrderDate: new Date().toISOString()
    });
  } else {
    const newCustomer: Customer = {
      ...customerData,
      id: customerId,
      totalOrders: 1,
      totalSpent: 0, 
      lastOrderDate: new Date().toISOString()
    };
    await setDoc(customerRef, newCustomer);
  }
}

/**
 * Get all pending payment proofs for platform manager.
 */
export async function getPendingPayments(): Promise<PaymentProof[]> {
  try {
    const proofsCol = collection(db, 'platform', 'payments', 'proofs');
    const q = query(proofsCol, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PaymentProof);
  } catch (error) {
    console.error("Error fetching proofs:", error);
    return [];
  }
}

/**
 * Approve a merchant's subscription.
 */
export async function approveStoreSubscription(proofId: string, storeSlug: string, plan: 'pro' | 'business'): Promise<void> {
  const proofRef = doc(db, 'platform', 'payments', 'proofs', proofId);
  const storeRef = doc(db, 'stores', storeSlug);

  // 1. Update payment status
  await updateDoc(proofRef, { status: 'approved' });

  // 2. Update store plan and status
  await updateDoc(storeRef, {
    subscriptionStatus: 'active',
    planType: plan
  });
}

/**
 * Reject a merchant's subscription proof.
 */
export async function rejectStoreSubscription(proofId: string, storeSlug: string): Promise<void> {
  const proofRef = doc(db, 'platform', 'payments', 'proofs', proofId);
  const storeRef = doc(db, 'stores', storeSlug);

  await updateDoc(proofRef, { status: 'rejected' });
  await updateDoc(storeRef, { subscriptionStatus: 'rejected' });
}
