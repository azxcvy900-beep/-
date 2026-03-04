import React from 'react';
import { ArrowRight, Sparkles, Check, Layers } from 'lucide-react';

interface Props {
    user: any;
    setView: (view: 'landing' | 'studio' | 'admin' | 'pricing' | 'login' | 'terms' | 'privacy' | 'refund') => void;
}

export default function PricingPage({ user, setView }: Props) {
    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col relative selection:bg-yafa-gold/30 selection:text-white" dir="rtl">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.05),transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            {/* Minimal Header */}
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

            {/* Content */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 py-24">
                <div className="text-center mb-20 max-w-2xl mx-auto space-y-6">
                    <h1 className="text-5xl md:text-6xl font-serif italic text-[#f5f5f0]">استثمر في صورتك.</h1>
                    <p className="text-lg text-[#f5f5f0]/50 font-light leading-loose">
                        اختر الباقة التي تناسب حجم إبداعك. أطلق العنان لمبيعاتك مع أدوات يافا المدعومة بالذكاء الاصطناعي.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
                    {/* Free/Basic Tier */}
                    <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] backdrop-blur-sm hover:border-white/20 transition-all duration-500 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors" />
                        <h3 className="text-2xl font-bold mb-2">الباقة الأساسية</h3>
                        <p className="text-white/50 text-sm mb-8">للتجربة والبدايات البسيطة</p>
                        <div className="mb-10 flex items-baseline gap-2">
                            <span className="text-5xl font-black">مجاناً</span>
                        </div>
                        <ul className="space-y-4 flex-1 mb-10">
                            {[
                                'توليد صورتين احترافيتين للتجربة',
                                'جودة قياسية (Standard HD)',
                                'تحديد الجنس والعمر للعارض',
                                'علامة يافا المائية على الصور'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                                    <Check className="w-4 h-4 text-white/40" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => user ? setView('studio') : setView('login')}
                            className="w-full py-4 rounded-xl border border-white/20 text-white font-bold text-sm hover:bg-white hover:text-black transition-all duration-300"
                        >
                            {user ? 'ابدأ الآن' : 'سجل مجاناً'}
                        </button>
                    </div>

                    {/* Premium Tier */}
                    <div className="bg-[#0a0a0a] border border-yafa-gold/30 p-10 rounded-[2rem] backdrop-blur-sm relative overflow-hidden group shadow-[0_0_50px_rgba(251,191,36,0.05)] transform hover:-translate-y-2 transition-transform duration-500">
                        {/* Gold Accents */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-yafa-gold to-transparent opacity-50" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yafa-gold/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-yafa-gold/20 transition-colors duration-700" />

                        <div className="inline-block px-3 py-1 bg-yafa-gold text-black text-[10px] font-bold uppercase tracking-widest rounded-full mb-6 relative z-10">
                            الأكثر طلباً للمحترفين
                        </div>

                        <h3 className="text-2xl font-bold mb-2 text-yafa-gold">باقة الأعمال VIP</h3>
                        <p className="text-white/50 text-sm mb-8">للعلامات التجارية والمتاجر الإلكترونية</p>
                        <div className="mb-10 flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white">$49</span>
                            <span className="text-white/40">/ شهرياً</span>
                        </div>
                        <ul className="space-y-4 flex-1 mb-10 relative z-10">
                            {[
                                'توليد 500 صورة احترافية كل شهر',
                                'جودة فائقة (8K Photorealistic)',
                                'بدون علامة مائية (تجارية 100%)',
                                'استخدام العارضين البشريين والأنسجة المعقدة',
                                'دعم فني ذو أولوية'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                                    <Sparkles className="w-4 h-4 text-yafa-gold/70" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => {
                                alert('سيتم ربط بوابة الدفع (Stripe/PayTabs) لاحقاً هنا. شكراً لاختيارك يافا ديزاين!');
                                if (!user) setView('login');
                            }}
                            className="w-full py-4 rounded-xl bg-yafa-gold text-black font-bold text-sm hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:scale-[1.02] transition-all duration-300 relative z-10"
                        >
                            الاشتراك الآن
                        </button>
                    </div>
                </div>

                <div className="mt-20 text-center opacity-40">
                    <Layers className="w-6 h-6 mx-auto mb-4" />
                    <p className="text-[10px] uppercase tracking-[0.3em]">Yafa Enterprise Solutions</p>
                </div>
            </main>
        </div>
    );
}
