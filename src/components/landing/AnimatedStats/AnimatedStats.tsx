'use client';

import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './AnimatedStats.module.css';

interface StatProps {
  label: string;
  value: number;
  suffix?: string;
  duration?: number;
}

const StatCounter: React.FC<StatProps> = ({ label, value, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalMiliseconds = duration * 1000;
      const incrementTime = 50;
      const totalSteps = totalMiliseconds / incrementTime;
      const stepValue = (end - start) / totalSteps;

      const timer = setInterval(() => {
        start += stepValue;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <div className={styles.statItem} ref={ref}>
      <motion.div 
        className={styles.value}
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
      >
        {count.toLocaleString()}{suffix}
      </motion.div>
      <div className={styles.label}>{label}</div>
    </div>
  );
};

const AnimatedStats = ({ t }: { t: any }) => {
  return (
    <section className={styles.statsContainer}>
      <div className={styles.statsGrid}>
        <StatCounter label="متجر مفعل" value={1200} suffix="+" />
        <StatCounter label="طلب ناجح" value={500} suffix="K" />
        <StatCounter label="نسبة الاستقرار" value={99} suffix="%" />
        <StatCounter label="دعم فني" value={24} suffix="/7" />
      </div>
    </section>
  );
};

export default AnimatedStats;
