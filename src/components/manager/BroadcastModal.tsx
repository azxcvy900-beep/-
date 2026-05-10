'use client';

import React, { useState } from 'react';
import { Megaphone, Send, X, Users, Store, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendGlobalNotification, UserRole } from '@/lib/api';
import { toast } from 'sonner';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole>('merchant');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      toast.error('يرجى ملء العنوان والرسالة');
      return;
    }

    setLoading(true);
    try {
      await sendGlobalNotification(targetRole, title, message, link);
      toast.success('تم إرسال التعميم بنجاح');
      setTitle('');
      setMessage('');
      setLink('');
      onClose();
    } catch (error) {
      toast.error('فشل إرسال التعميم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">إرسال تعميم إداري</h2>
                  <p className="text-sm text-blue-100">سيظهر هذا التنبيه لجميع المستخدمين المستهدفين.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">الفئة المستهدفة</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'merchant', name: 'التجار', icon: Store },
                    { id: 'customer', name: 'العملاء', icon: User },
                    { id: 'all', name: 'الكل', icon: Users },
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setTargetRole(role.id as any)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        targetRole === role.id 
                          ? 'border-blue-600 bg-blue-50 text-blue-600' 
                          : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <role.icon size={20} />
                      <span className="text-xs font-bold">{role.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">عنوان التنبيه</label>
                <input 
                  type="text" 
                  placeholder="مثال: تحديث أمني هام لنظام المتاجر"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">نص الرسالة</label>
                <textarea 
                  placeholder="اكتب تفاصيل التعميم هنا..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">رابط توجيهي (اختياري)</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <button 
                disabled={loading}
                onClick={handleSend}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? 'جاري الإرسال...' : (
                  <>
                    <Send size={20} />
                    إرسال التعميم الآن
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BroadcastModal;
