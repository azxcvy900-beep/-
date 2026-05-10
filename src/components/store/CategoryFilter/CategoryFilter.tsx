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
    <div className={styles.scrollWrapper}>
      <div className={styles.filterContainer}>
        <button
          className={`${styles.pill} ${activeCategory === 'all' ? styles.active : ''}`}
          onClick={() => onSelectCategory('all')}
        >
          {allLabel}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.pill} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
