'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  allLabel: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  activeCategory, 
  onSelectCategory,
  allLabel 
}) => {
  return (
    <div className={styles.filterContainer}>
      <motion.button
        className={`${styles.categoryBtn} ${activeCategory === 'all' ? styles.active : ''}`}
        onClick={() => onSelectCategory('all')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {allLabel}
      </motion.button>
      
      {categories.map((category) => (
        <motion.button
          key={category}
          className={`${styles.categoryBtn} ${activeCategory === category ? styles.active : ''}`}
          onClick={() => onSelectCategory(category)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;
