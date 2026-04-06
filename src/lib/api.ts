import { db } from './firebase';
import { collection, getDocs, doc, getDoc, writeBatch, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Order } from './store';

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
  storeSlug: string;
  options?: ProductOption[];
}

export interface StoreInfo {
  slug: string;
  name: string;
  logo?: string;
  description?: string;
  phone: string;
  social?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro Max - 256GB',
    price: 1250000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
    description: 'يتميز iPhone 15 Pro بتصميم من التيتانيوم القوي والخفيف، مع زر الإجراءات القابل للتخصيص، ونظام الكاميرا الأكثر تقدماً في iPhone حتى الآن.',
    storeSlug: 'demo',
    options: [
      { name: 'اللون', values: ['تيتانيوم طبيعي', 'تيتانيوم أزرق', 'تيتانيوم أسود'] }
    ]
  },
  {
    id: 'sony-xm5',
    name: 'Sony WH-1000XM5 Headphones',
    price: 380000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1675243048035-9051873b624d?w=800&q=80',
    description: 'سماعات الرأس الرائدة عالمياً في إلغاء الضوضاء، تمنحك تجربة استماع غامرة ونقاء صوت لا يضاهى مع عمر بطارية يصل لـ 30 ساعة.',
    storeSlug: 'demo'
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
    ]
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
    ]
  },
  {
    id: 'playstation-5',
    name: 'PlayStation 5 Console',
    price: 550000,
    category: 'ألعاب',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80',
    description: 'انطلق في مغامرات لا حدود لها مع منصة الألعاب الأقوى في العالم، والتي توفر تجربة لعب بدقة 4K وسرعات تحميل فائقة.',
    storeSlug: 'demo'
  },
  {
    id: 'al-kbous-coffee',
    name: 'قهوة الكبوس - خلطة عربية',
    price: 1500,
    category: 'منتجات محلية',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    description: 'قهوة الكبوس الشهيرة بعبقها الأصيل ونكهتها الغنية التي تعكس تراث القهوة اليمنية وتمنحك بداية يوم مثالية.',
    storeSlug: 'demo'
  }
];

const DUMMY_STORES: StoreInfo[] = [
  {
    slug: 'demo',
    name: 'متجر بايرز التجريبي',
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
  // Optimization: Instant dummy data for 'demo' store to solve delay issues
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
  // Optimization: If it's a dummy product, return it IMMEDIATELY without network hit
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

// Fetch related products (same category, different ID)
export async function getRelatedProducts(category: string, excludeId: string, storeSlug: string = 'demo', limit: number = 4): Promise<Product[]> {
  const allProducts = await getStoreProducts(storeSlug); 
  return allProducts
    .filter(p => p.category === category && p.id !== excludeId)
    .slice(0, limit);
}

// Helper to seed database initially
export async function seedDatabase() {
  try {
    const batch = writeBatch(db);
    DUMMY_PRODUCTS.forEach(product => {
      const productRef = doc(db, 'products', product.id);
      batch.set(productRef, product);
    });
    await batch.commit();
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// --- MERCHANT API ---

// Add a new product
export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  try {
    const productsCol = collection(db, 'products');
    const docRef = doc(productsCol);
    const newProduct = { ...product, id: docRef.id };
    await writeBatch(db).set(doc(db, 'products', newProduct.id), newProduct).commit();
    return newProduct.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

// Update existing product
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, 'products', id);
    await writeBatch(db).update(productRef, updates as any).commit();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  try {
    const productRef = doc(db, 'products', id);
    await writeBatch(db).delete(productRef).commit();
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// Fetch all orders for a specific store
export async function getStoreOrders(storeSlug: string): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCol);
    return orderSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order))
      .filter(o => o.items.some(item => (item as any).storeSlug === storeSlug || storeSlug === 'demo'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching store orders:", error);
    return [];
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await writeBatch(db).update(orderRef, { status }).commit();
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

// Update store information
export async function updateStoreInfo(slug: string, updates: Partial<StoreInfo>): Promise<void> {
  try {
    const storeRef = doc(db, 'stores', slug);
    await writeBatch(db).update(storeRef, updates as any).commit();
  } catch (error) {
    console.error("Error updating store info:", error);
    throw error;
  }
}
