import React from 'react';
import Skeleton from '@/components/shared/Skeleton/Skeleton';
import styles from './StoreSkeleton.module.css';

const StoreSkeleton = () => {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={styles.card}>
            <Skeleton height="180px" borderRadius="16px" className={styles.image} />
            <div className={styles.info}>
              <Skeleton width="80%" height="1.2rem" />
              <Skeleton width="40%" height="1rem" />
              <div className={styles.footer}>
                <Skeleton width="50%" height="1.5rem" />
                <Skeleton width="35px" height="35px" borderRadius="10px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreSkeleton;
