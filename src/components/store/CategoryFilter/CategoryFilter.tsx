import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  allLabel: string;
}

// Color and image mapping for categories
const categoryMap: Record<string, { image: string, color: string }> = {
  'all': {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80',
    color: '#3b82f6'
  },
  'إلكترونيات': {
    image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=200&q=80',
    color: '#ef4444'
  },
  'Electronics': {
    image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=200&q=80',
    color: '#ef4444'
  },
  'حواسيب': {
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80',
    color: '#8b5cf6'
  },
  'Computers': {
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80',
    color: '#8b5cf6'
  },
  'ألعاب': {
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80',
    color: '#f59e0b'
  },
  'Gaming': {
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80',
    color: '#f59e0b'
  },
  'منتجات محلية': {
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&q=80',
    color: '#22c55e'
  },
  'Local Products': {
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&q=80',
    color: '#22c55e'
  },
  'fallback': {
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80',
    color: '#6b7280'
  }
};

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  activeCategory, 
  onSelectCategory,
  allLabel 
}) => {
  const renderItem = (id: string, label: string) => {
    const data = categoryMap[id] || categoryMap['fallback'];
    const isActive = activeCategory === id;

    return (
      <motion.div
        key={id}
        className={`${styles.categoryItem} ${isActive ? styles.active : ''}`}
        onClick={() => onSelectCategory(id)}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={styles.circleWrapper} style={{ '--accent-color': data.color } as any}>
          <div className={styles.circle}>
            <Image 
              src={data.image} 
              alt={label} 
              fill 
              className={styles.image}
              sizes="80px"
            />
          </div>
          {isActive && (
            <motion.div 
              layoutId="glow"
              className={styles.glow}
              style={{ background: data.color }}
            />
          )}
        </div>
        <span className={styles.label}>{label}</span>
      </motion.div>
    );
  };

  return (
    <div className={styles.filterContainer}>
      {renderItem('all', allLabel)}
      {categories.map((cat) => renderItem(cat, cat))}
    </div>
  );
};

export default CategoryFilter;
