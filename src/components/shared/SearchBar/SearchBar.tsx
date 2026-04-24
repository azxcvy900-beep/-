'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onFocus?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder, onFocus }) => {
  return (
    <div className={styles.searchWrapper}>
      <div className={styles.inputContainer}>
        <Search className={styles.searchIcon} size={20} />
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={styles.clearBtn}
              onClick={() => onChange('')}
            >
              <X size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchBar;
