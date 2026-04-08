'use client';

import { useEffect, useState } from 'react';
import { seedDatabase } from '@/lib/api';
import { useRouter, useLocale } from 'next/navigation';
import { motion } from 'framer-motion';
import { Database, CheckCircle, RefreshCw } from 'lucide-react';

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    const runSeed = async () => {
      setStatus('loading');
      try {
        await seedDatabase();
        setStatus('success');
        // Redirect to manager after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}/manager`);
        }, 2000);
      } catch (error) {
        console.error("Seed error:", error);
        setStatus('error');
      }
    };

    runSeed();
  }, [router, locale]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'var(--font-cairo)'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'white', 
          padding: '3rem', 
          borderRadius: '24px', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
          textAlign: 'center',
          maxWidth: '400px'
        }}
      >
        {status === 'loading' && (
          <>
            <RefreshCw size={48} color="#1a73e8" style={{ animation: 'spin 2s linear infinite' }} />
            <h2 style={{ marginTop: '1.5rem' }}>جاري ربط البيانات...</h2>
            <p style={{ color: '#64748b' }}>نقوم الآن برفع المتاجر والمنتجات إلى قاعدة البيانات (Firestore)</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} color="#10b981" />
            <h2 style={{ marginTop: '1.5rem', color: '#065f46' }}>تم الربط بنجاح!</h2>
            <p style={{ color: '#64748b' }}>عالم "بايرز" أصبح الآن حياً ومستعداً للانطلاق. جاري نقلك للإدارة...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <Database size={48} color="#ef4444" />
            <h2 style={{ marginTop: '1.5rem', color: '#991b1b' }}>فشل الربط!</h2>
            <p style={{ color: '#64748b' }}>تأكد من إعدادات Firebase الخاصة بك في ملف البيئة.</p>
          </>
        )}
      </motion.div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
