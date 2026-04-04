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

const DUMMY_PRODUCTS = [
  {
    id: '1',
    name: 'ساعة آبل الذكية الجيل الثامن',
    price: 150000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1546868889-4e0ca0492cb4?w=800&q=80',
    description: 'تتميز ساعة Apple Watch Series 8 بمستشعرات وتطبيقات صحية متطورة، تتيح لك إجراء مخطط كهربائية القلب، وقياس معدل نبضات القلب، والأكسجين في الدم، وتتبع التغيرات في درجة الحرارة للحصول على رؤى متقدمة حول الدورة الشهرية.',
    storeSlug: 'demo'
  },
  {
    id: '2',
    name: 'سماعات سوني لاسلكية عازلة للضوضاء',
    price: 120000,
    category: 'إلكترونيات',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    description: 'سماعات رأس لاسلكية بخاصية إلغاء الضوضاء الرائدة في الصناعة، توفر صوتاً نقياً وتجربة استماع ممتازة.',
    storeSlug: 'demo'
  },
  {
    id: '3',
    name: 'كاميرا كانون EOS R6 الاحترافية',
    price: 850000,
    category: 'تصوير',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    description: 'كاميرا احترافية بدون مرآة مع مستشعر عالي الدقة وتركيز تلقائي فائق السرعة، مثالية للمصورين ومصوري الفيديو.',
    storeSlug: 'demo'
  },
  {
    id: '4',
    name: 'لابتوب أبل ماك بوك برو M3',
    price: 1200000,
    category: 'حواسيب',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    description: 'لابتوب ماك بوك برو المتطور بشريحة M3 الجديدة كلياً التي تمنحك قوة وسرعة لا تصدق في إنجاز المهام الثقيلة.',
    storeSlug: 'demo'
  },
  {
    id: '5',
    name: 'جهاز تحكم بلايستيشن 5 برو',
    price: 45000,
    category: 'ألعاب',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
    description: 'جهاز تحكم DualSense المبتكر لجهاز الألعاب بلايستيشن 5، يوفر استجابة لمسية ومؤثرات زناد ديناميكية.',
    storeSlug: 'demo'
  },
  {
    id: '6',
    name: 'إضاءة مكتبية ذكية RGB',
    price: 15000,
    category: 'ديكور مكتب',
    image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&q=80',
    description: 'إضاءة ذكية وقابلة للتخصيص بملايين الألوان، تضيف لمسة جمالية وعصرية لمكتبك مع إمكانية التحكم بها عبر التطبيق.',
    storeSlug: 'demo'
  },
];

// Fetch all products for a specific store
export async function getStoreProducts(storeSlug: string): Promise<Product[]> {
  try {
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    
    // Filter client side for now, ideally this would be a queried index:
    // query(productsCol, where("storeSlug", "==", storeSlug)) 
    // but requires setting up indexes if compound.
    const storeProducts = productList.filter(p => p.storeSlug === storeSlug);
    
    if (storeProducts.length === 0) {
      // Return dummy data if DB is empty to avoid blank screen
      return DUMMY_PRODUCTS;
    }
    
    return storeProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    return DUMMY_PRODUCTS; // Fallback to dummy data
  }
}

// Fetch single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const productDoc = doc(db, 'products', id);
    const productSnap = await getDoc(productDoc);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    } else {
      // Fallback
      return DUMMY_PRODUCTS.find(p => p.id === id) || null;
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    return DUMMY_PRODUCTS.find(p => p.id === id) || null;
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
