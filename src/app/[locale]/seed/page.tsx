'use client';

import React, { useState } from 'react';
import { seedDatabase } from '@/lib/api';

export default function SeedPage() {
  const [status, setStatus] = useState('');

  const handleSeed = async () => {
    setStatus('جاري رفع المنتجات الوهمية...');
    try {
      await seedDatabase();
      setStatus('تم الرفع بنجاح! يمكنك الآن زيارة المتجر التجريبي.');
    } catch (error: any) {
      setStatus(`حدث خطأ: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '5rem', textAlign: 'center', minHeight: '100vh', direction: 'rtl' }}>
      <h1>أداة تهيئة قاعدة البيانات 🚀</h1>
      <p>ستقوم هذه الأداة برفع البيانات الوهمية للمنتجات إلى قاعدة بياناتك في Firestore لتتمكن من تجربتها.</p>
      
      <button 
        onClick={handleSeed}
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        رفع البيانات الآن
      </button>

      {status && (
        <p style={{ marginTop: '2rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {status}
        </p>
      )}
    </div>
  );
}
