'use client';

import React from 'react';
import styles from './Skeletons.module.css';

export function StatSkeleton() {
  return (
    <div className={styles.statSkeleton}>
      <div className={styles.info}>
        <div className={styles.labelLine} />
        <div className={styles.valueLine} />
        <div className={styles.subLine} />
      </div>
      <div className={styles.iconCircle} />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.listSkeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.listItem}>
          <div className={styles.itemImage} />
          <div className={styles.itemInfo}>
            <div className={styles.itemTitle} />
            <div className={styles.itemSub} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.tableSkeleton}>
      <div className={styles.tableHeader}>
        <div className={styles.hCell} />
        <div className={styles.hCell} />
        <div className={styles.hCell} />
        <div className={styles.hCell} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={styles.cell} />
        </div>
      ))}
    </div>
  );
}
