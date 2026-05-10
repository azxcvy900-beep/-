'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { 
  getTicketMessages, 
  addTicketMessage,
  SupportTicket,
  TicketMessage
} from '@/lib/api';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import styles from './manager-support.module.css';

export default function ManagerSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');

  useEffect(() => {
    loadAllTickets();
  }, []);

  const loadAllTickets = async () => {
    try {
      const q = query(collection(db, 'support_tickets'), orderBy('lastUpdate', 'desc'));
      const snap = await getDocs(q);
      setTickets(snap.docs.map(doc => doc.data() as SupportTicket));
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
      // Mark as in_progress if open
      if (ticket.status === 'open') {
        await updateDoc(doc(db, 'support_tickets', ticket.id), { status: 'in_progress' });
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'in_progress' } : t));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      await addTicketMessage(selectedTicket.id, 'admin_global', 'admin', reply);
      setReply('');
      const msgs = await getTicketMessages(selectedTicket.id);
      setMessages(msgs);
      toast.success('تم إرسال الرد');
    } catch (error) {
      toast.error('فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;
    await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: 'closed' });
    setSelectedTicket({ ...selectedTicket, status: 'closed' });
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'closed' } : t));
    toast.info('تم إغلاق التذكرة');
  };

  if (loading && tickets.length === 0) return <div className={styles.loading}><Loader2 className="animate-spin" /></div>;

  return (
    <div className={styles.supportPage}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>إدارة تذاكر الدعم 🎫</h1>
          <p>الرد على استفسارات ومشاكل التجار عبر المنصة.</p>
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}>
              <option value="all">كل الأولويات</option>
              <option value="high">عاجل جداً</option>
              <option value="medium">متوسط</option>
              <option value="low">عادي</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">كل الحالات</option>
              <option value="open">جديدة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.ticketList}>
          {tickets
            .filter(t => (priorityFilter === 'all' || t.priority === priorityFilter) && (statusFilter === 'all' || t.status === statusFilter))
            .map(ticket => (
            <div 
              key={ticket.id} 
              className={`${styles.ticketItem} ${selectedTicket?.id === ticket.id ? styles.activeTicket : ''} ${styles[`priority_${ticket.priority}`]}`}
              onClick={() => handleSelectTicket(ticket)}
            >
              <div className={styles.ticketMain}>
                 <span className={styles.ticketSubject}>{ticket.subject}</span>
                 <div className="flex gap-2">
                    <span className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                      {ticket.status === 'open' ? 'جديدة' : ticket.status === 'in_progress' ? 'متابعة' : 'مغلقة'}
                    </span>
                    <span className={`${styles.priorityBadge} ${styles[ticket.priority]}`}>
                      {ticket.priority === 'high' ? 'عاجل' : ticket.priority === 'medium' ? 'متوسط' : 'عادي'}
                    </span>
                 </div>
              </div>
              <div className={styles.ticketMeta}>
                 <span>المتجر: {ticket.storeSlug}</span>
                 <span>{new Date(ticket.lastUpdate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chatArea}>
          {selectedTicket ? (
            <div className={styles.chatContainer}>
               <div className={styles.chatHeader}>
                 <div>
                   <h3>{selectedTicket.subject}</h3>
                   <p>المتجر: {selectedTicket.storeSlug} | الأولوية: {selectedTicket.priority}</p>
                 </div>
                 <button className={styles.closeBtn} onClick={closeTicket}>إغلاق التذكرة</button>
               </div>
               <div className={styles.messages}>
                 {messages.map(msg => (
                   <div key={msg.id} className={`${styles.message} ${msg.senderRole === 'admin' ? styles.mine : styles.theirs}`}>
                     <div className={styles.msgBubble}>
                       <strong>{msg.senderRole === 'admin' ? 'الإدارة' : 'التاجر'}</strong>
                       <p>{msg.message}</p>
                       <span className={styles.msgTime}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                     </div>
                   </div>
                 ))}
               </div>
               {selectedTicket.status !== 'closed' && (
                 <form className={styles.replyForm} onSubmit={handleReply}>
                   <input 
                     type="text" 
                     placeholder="اكتب رد الإدارة هنا..." 
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
              <p>اختر تذكرة للبدء في الرد عليها</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
