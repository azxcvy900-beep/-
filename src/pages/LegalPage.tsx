import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Props {
    view: 'terms' | 'privacy' | 'refund';
    setView: (view: 'landing' | 'studio' | 'admin' | 'pricing' | 'login' | 'terms' | 'privacy' | 'refund') => void;
}

export default function LegalPage({ view, setView }: Props) {
    const isTerms = view === 'terms';
    const isPrivacy = view === 'privacy';

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col relative selection:bg-yafa-gold/30 selection:text-white" dir="rtl">
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 relative z-10 bg-black/50 backdrop-blur-xl">
                <button onClick={() => setView('landing')} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="font-bold text-sm tracking-widest uppercase">العودة للرئيسية</span>
                </button>
                <div className="flex items-center gap-3">
                    <Sparkles className="text-yafa-gold w-5 h-5" />
                    <span className="font-bold text-lg tracking-tight">يافا ديزاين</span>
                </div>
            </header>

            <main className="flex-1 relative z-10 p-10 py-24 max-w-4xl mx-auto w-full">
                <h1 className="text-4xl font-black mb-12 text-yafa-gold">
                    {isTerms ? 'الشروط والأحكام' : isPrivacy ? 'سياسة الخصوصية' : 'سياسة الاسترداد'}
                </h1>
                <div className="space-y-8 text-[#f5f5f0]/70 leading-relaxed text-sm">
                    {isTerms ? (
                        <>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">1. قبول الشروط</h2>
                                <p>باستخدامك لموقع يافا ديزاين، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، فلا يجب عليك استخدام الخدمة.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">2. وصف الخدمة</h2>
                                <p>يافا ديزاين هي منصة تعمل بالذكاء الاصطناعي لتوليد صور عارضي الأزياء والملابس. الخدمة مقدمة "كما هي" وبناءً على توفرها.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">3. الاشتراكات والاسترداد</h2>
                                <p>الاشتراكات في باقات VIP تخضع لسياسة الاسترداد الخاصة بنا الموضحة في صفحة سياسة الاسترداد. يتم تجديد الاشتراك تلقائياً ما لم يتم إلغاؤه من قبل المستخدم.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">4. حقوق الملكية</h2>
                                <p>الصور المولدة عبر الباقات المدفوعة هي ملك للمستخدم للاستخدام التجاري. الصور في الباقة المجانية تظل ملكاً لموقع يافا ديزاين ولا يجوز استخدامها تجارياً.</p>
                            </section>
                        </>
                    ) : isPrivacy ? (
                        <>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">1. جمع البيانات</h2>
                                <p>نحن نجمع فقط البيانات الضرورية لتقديم الخدمة، وهي: البريد الإلكتروني، الاسم، والصور التي تقوم برفعها لمعالجتها بالذكاء الاصطناعي.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">2. حماية الصور</h2>
                                <p>الصور التي ترفعها يتم استخدامها فقط لتوليد فئاتك المختارة، ولا نقوم بمشاركتها مع أطراف ثالثة أو استخدامها لأغراض إعلانية دون إذنك.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">3. ملفات تعريف الارتباط</h2>
                                <p>نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربة تسجيل الدخول وحفظ إعدادات الاستوديو المفضلة لديك.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">4. التعديل على البيانات</h2>
                                <p>يحق لك طلب حذف حسابك وبياناتك بالكامل في أي وقت من خلال التواصل مع الدعم الفني.</p>
                            </section>
                        </>
                    ) : (
                        <>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">1. نطاق الاسترداد</h2>
                                <p>نظراً للطبيعة الرقمية للخدمة والذكاء الاصطناعي، يتم تقديم المبالغ المستردة فقط في حالة وجود عطل فني مثبت يمنع المستخدم من الحصول على الخدمة بشكل كامل لمدة تزيد عن 48 ساعة.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">2. حالات لا ينطبق فيها الاسترداد</h2>
                                <p>لا يحق للمستخدم طلب استرداد مالي بعد البدء في استخدام رصيد "توليد الصور" المخصص للباقة، أو في حالة عدم الرضا الشخصي عن "النتيجة الفنية" للذكاء الاصطناعي طالما أن المحرك يعمل بشكل سليم.</p>
                            </section>
                            <section>
                                <h2 className="text-white font-bold mb-3 text-lg">3. معالجة طلبات الاسترداد</h2>
                                <p>يجب تقديم طلب الاسترداد خلال 7 أيام من تاريخ العملية الشرائية، وذلك عبر التواصل مع الدعم الفني وتوضيح الأسباب الفنية.</p>
                            </section>
                        </>
                    )}
                </div>
                <div className="mt-20 pt-10 border-t border-white/5 text-center">
                    <p className="text-[10px] uppercase tracking-widest opacity-30">© 2026 YAFA DESIGN STUDIO LEGAL DEPT</p>
                </div>
            </main>
        </div>
    );
}
