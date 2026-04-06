import { db } from './firebase';
import { collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
  storeSlug: string;
}

const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro Max - 256GB',
    price: 1250000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
    description: 'يتميز iPhone 15 Pro بتصميم من التيتانيوم القوي والخفيف، مع زر الإجراءات القابل للتخصيص، ونظام الكاميرا الأكثر تقدماً في iPhone حتى الآن.',
    storeSlug: 'demo'
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
    storeSlug: 'demo'
  },
  {
    id: 'yemeni-honey',
    name: 'عسل سدر ملكي فاخر دوعني',
    price: 45000,
    category: 'منتجات محلية',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
    description: 'عسل سدر يمني طبيعي 100% من وادي دوعن، يتميز بطعمه الفريد وخصائصه العلاجية النادرة وجودته العالية جداً.',
    storeSlug: 'demo'
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

// Fetch all products for a specific store
export async function getStoreProducts(storeSlug: string): Promise<Product[]> {
  // Optimization: Instant dummy data for 'demo' store to solve delay issues
  if (storeSlug === 'demo') {
    return DUMMY_PRODUCTS;
  }

  try {
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    
    const storeProducts = productList.filter(p => p.storeSlug === storeSlug);
    
    if (storeProducts.length === 0) {
      return DUMMY_PRODUCTS;
    }
    
    return storeProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    return DUMMY_PRODUCTS;
  }
}

// Fetch single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  // Optimization: Instant search in dummy data first for demo/fallback speed
  const dummyProduct = DUMMY_PRODUCTS.find(p => p.id === id);
  
  try {
    const productDoc = doc(db, 'products', id);
    const productSnap = await getDoc(productDoc);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    } else {
      return dummyProduct || null;
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    return dummyProduct || null;
  }
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
