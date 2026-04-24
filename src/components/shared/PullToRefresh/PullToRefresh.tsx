import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controls = useAnimation();
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Damping effect
      const distance = Math.min(diff * 0.4, 80);
      setPullDistance(distance);
      if (distance > 60 && pullDistance <= 60) {
        triggerHaptic('light');
      }
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || isRefreshing) return;
    isPulling.current = false;

    if (pullDistance > 60) {
      setIsRefreshing(true);
      setPullDistance(60);
      triggerHaptic('medium');
      await onRefresh();
      setIsRefreshing(false);
      setPullDistance(0);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: -40,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          zIndex: 50,
          pointerEvents: 'none'
        }}
        animate={{ 
          y: pullDistance,
          opacity: pullDistance > 10 ? 1 : 0 
        }}
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 3 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: 'spring' }}
          style={{
            background: 'white',
            borderRadius: '50%',
            padding: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            color: 'var(--primary)'
          }}
        >
          <RefreshCcw size={20} />
        </motion.div>
      </motion.div>
      
      <motion.div
        animate={{ y: pullDistance }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
