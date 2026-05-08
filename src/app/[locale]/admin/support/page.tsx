'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  createSupportTicket, 
  getStoreTickets, 
  getTicketMessages, 
  addTicketMessage,
  SupportTicket,
  TicketMessage
} from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';
import styles from './support.module.css';

export default function MerchantSupport() {
  const { storeSlug, merchantId } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' as any });
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (storeSlug) {
      loadTickets();
    }
  }, [storeSlug]);

  const loadTickets = async () => {
    try {
      const data = await getStoreTickets(storeSlug!);
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoading(true);
    try {
      const msgs = await getTicketMessages(ticket.id);
      setMessages(msgs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !storeSlug) return;
    setSending(true);
    try {
      await createSupportTicket({
        merchantId,
        storeSlug,
        subject: newTicket.subject,
        priority: newTicket.priority
      }, newTicket.message);
      toast.success('تم فتح التذكرة بنجاح');
      setShowNewModal(false);
      loadTickets();
    } catch (error) {
      toast.error('فشل إرسال التذكرة');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim() || !merchantId) return;
    setSending(true);
    try {
      await addTicketMessage(selectedTicket.id, merchantId, 'merchant', reply);
      setReply('');
      const msgs = await getTicketMessages(selectedTicket.id);
      setMessages(msgs);
    } catch (error) {
      toast.error('فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  if (loading && tickets.length === 0) return <div className={styles.loading}><Loader2 className="animate-spin" /></div>;

  return (
    <div className={styles.supportPage}>
      <header className={styles.header}>
        <div>
          <h1>الدعم الفني 🎧</h1>
          <p>تواصل مع إدارة بايرز لحل أي مشكلة أو استفسار.</p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowNewModal(true)}>
          <Plus size={20} /> فتح تذكرة جديدة
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.ticketList}>
          {tickets.length === 0 ? (
            <div className={styles.empty}>لا توجد تذاكر دعم سابقة.</div>
          ) : (
            tickets.map(ticket => (
              <div 
                key={ticket.id} 
                className={`${styles.ticketItem} ${selectedTicket?.id === ticket.id ? styles.activeTicket : ''}`}
                onClick={() => handleSelectTicket(ticket)}
              >
                <div className={styles.ticketMain}>
                   <span className={styles.ticketSubject}>{ticket.subject}</span>
                   <span className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                     {ticket.status === 'open' ? 'مفتوحة' : ticket.status === 'in_progress' ? 'قيد المعالجة' : 'مغلقة'}
                   </span>
                </div>
                <div className={styles.ticketMeta}>
                   <span># {ticket.id.slice(-8)}</span>
                   <span>{new Date(ticket.lastUpdate).toLocaleDateString('ar-YE')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.chatArea}>
          {selectedTicket ? (
            <div className={styles.chatContainer}>
               <div className={styles.chatHeader}>
                 <h3>{selectedTicket.subject}</h3>
                 <span className={styles.priority}>الأولوية: {selectedTicket.priority}</span>
               </div>
               <div className={styles.messages}>
                 {messages.map(msg => (
                   <div key={msg.id} className={`${styles.message} ${msg.senderRole === 'merchant' ? styles.mine : styles.theirs}`}>
                     <div className={styles.msgBubble}>
                       {msg.message}
                       <span className={styles.msgTime}>{new Date(msg.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                   </div>
                 ))}
               </div>
               {selectedTicket.status !== 'closed' && (
                 <form className={styles.replyForm} onSubmit={handleReply}>
                   <input 
                     type="text" 
                     placeholder="اكتب ردك هنا..." 
                     value={reply}
                     onChange={(e) => setReply(e.target.value)}
                   />
                   <button type="submit" disabled={sending || !reply.trim()}>
                     {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                   </button>
                 </form>
               )}
            </div>
          ) : (
            <div className={styles.noSelection}>
              <MessageSquare size={48} />
              <p>اختر تذكرة من القائمة لعرض المحادثة</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewModal && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={styles.modal}
            >
              <div className={styles.modalHeader}>
                <h2>فتح تذكرة دعم جديدة</h2>
                <button onClick={() => setShowNewModal(false)}><ChevronLeft /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className={styles.formGroup}>
                  <label>موضوع التذكرة</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="مثلاً: مشكلة في تفعيل الباقة" 
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>درجة الأهمية</label>
                  <select 
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                  >
                    <option value="low">عادية</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عاجلة</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>شرح المشكلة</label>
                  <textarea 
                    rows={4} 
                    required 
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={sending}>
                  {sending ? 'جاري الإرسال...' : 'إرسال التذكرة'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
