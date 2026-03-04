import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface Props {
    user: any;
    setView: (view: 'landing' | 'studio' | 'admin' | 'pricing' | 'login' | 'terms' | 'privacy' | 'refund') => void;
}

export default function LandingPage({ user, setView }: Props) {
    return (
        <div className="h-screen bg-[#0a0a0a] text-[#f5f5f0] font-sans overflow-y-auto custom-scrollbar relative selection:bg-white/20 selection:text-white" dir="rtl">
            {/* Minimalist Ultra-Luxury Navigation */}
            <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-8 flex items-center justify-between mix-blend-difference">
                <div className="flex items-center gap-4">
                    <span className="text-2xl md:text-3xl font-serif tracking-[0.3em] uppercase">يافا</span>
                </div>
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => setView('pricing')}
                        className="text-xs font-light tracking-[0.2em] uppercase hover:opacity-50 transition-opacity hidden md:block"
                    >
                        الأسعار
                    </button>
                    <button
                        onClick={() => user ? setView('studio') : setView('login')}
                        className="text-xs font-light tracking-[0.2em] uppercase hover:opacity-50 transition-opacity"
                    >
                        {user ? 'دخول الاستوديو' : 'دعوتك الخاصة (VIP)'}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Background Image with Heavy Overlay */}
                <div className="absolute inset-0 z-0">
                    <img src="/images/4.png" alt="Luxury Fashion" className="w-full h-full object-cover opacity-40 scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-transparent to-[#030303]" />
                </div>

                <div className="relative z-10 text-center max-w-5xl mx-auto px-6 mt-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
                    >
                        <div className="w-2 h-2 rounded-full bg-yafa-gold animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-yafa-gold flex-1 text-center">الجيل الجديد من أزياء الذكاء الاصطناعي</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="text-5xl md:text-8xl font-black tracking-tight leading-[1.2] md:leading-[1.1] mb-8"
                    >
                        أناقة لا تعترف <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yafa-gold via-yellow-200 to-yafa-gold/50 font-serif pr-2 md:pr-4">
                            بالحدود
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        className="text-base md:text-xl text-white/50 font-light max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        ارتقِ بتصاميمك إلى مستوى دور الأزياء العالمية. استوديو متكامل يدمج رؤيتك الفنية مع قوة الذكاء الاصطناعي لإنتاج جلسات تصوير مذهلة.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => user ? setView('studio') : setView('login')}
                        className="group relative px-8 md:px-12 py-4 md:py-5 bg-white text-black rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-4 mx-auto overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-shadow"
                    >
                        <span className="relative z-10">{user ? 'متابعة التصميم' : 'ابدأ تجربتك المجانية'}</span>
                        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center relative z-10 group-hover:bg-black/10 transition-colors">
                            <ArrowRight className="w-4 h-4 text-black group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>
            </section>

            {/* SECTION 3: The Luxuries (Features Editorial Style) */}
            <section className="py-32 md:py-48 px-6 relative bg-[#0a0a0a] z-10 border-t border-[#f5f5f0]/5">
                <div className="max-w-7xl mx-auto text-center mb-32">
                    <h2 className="text-4xl md:text-6xl font-serif text-[#f5f5f0] tracking-wide">الإمـكانيـات</h2>
                    <div className="h-[1px] w-12 bg-[#f5f5f0]/20 mx-auto mt-8" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 px-4 max-w-7xl mx-auto">
                    {[
                        { title: "العـارضـون", desc: "طاقم افتراضي من العارضين حول العالم، بملامح حصرية وأعمار مختلفة، تحت تصرفك بنقرة واحدة.", img: "/images/2.png" },
                        { title: "الأنـسجــة", desc: "حرير يلمع، وصوف تشعر بدفئه. خوارزمياتنا صُممت لتقرأ لغة القماش وتحافظ على ملمسه الواقعي.", img: "/images/3.png" },
                        { title: "الاسـتوديـو", desc: "إضاءة سينمائية، ظلال درامية، ومواقع تصوير من قمم الجليد إلى قصور باريس.", img: "/images/4.png" }
                    ].map((feature, i) => (
                        <div key={i} className="group cursor-pointer">
                            <div className="aspect-[3/4] overflow-hidden mb-10 relative">
                                <div className="absolute inset-0 bg-[#0a0a0a]/40 group-hover:bg-transparent transition-colors duration-1000 z-10 mix-blend-multiply" />
                                <img src={feature.img} alt={feature.title} className="w-full h-full object-cover scale-105 group-hover:scale-100 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[1.5s] ease-out" />
                            </div>
                            <h3 className="text-2xl font-serif mb-6 text-[#f5f5f0]/90 group-hover:text-[#f5f5f0] transition-colors">{feature.title}</h3>
                            <p className="text-[#f5f5f0]/40 font-light text-sm leading-loose">{feature.desc}</p>
                            <div className="h-[1px] w-0 bg-[#f5f5f0]/20 mt-8 group-hover:w-full transition-all duration-1000" />
                        </div>
                    ))}
                </div>
            </section>

            {/* SECTION 4: The VIP Invite */}
            <section className="py-48 px-6 relative bg-[#0a0a0a] z-10 border-t border-[#f5f5f0]/5 flex flex-col items-center justify-center text-center">
                <h2 className="text-5xl md:text-7xl font-serif italic text-[#f5f5f0] mb-12">حان دورك لتتصدر الأغلفة.</h2>
                <p className="text-[#f5f5f0]/50 font-light mb-16 max-w-xl text-lg md:text-xl leading-loose">
                    صنعنا البداية، والآن ننتظر إبداعك. احصل على دعوتك الخاصة لتجربة الاستوديو مجاناً الآن.
                </p>
                <button
                    onClick={() => user ? setView('studio') : setView('login')}
                    className="px-16 py-6 border border-[#f5f5f0]/30 text-[#f5f5f0] font-light text-xs tracking-[0.3em] uppercase hover:bg-[#f5f5f0] hover:text-[#0a0a0a] transition-all duration-700 bg-transparent"
                >
                    {user ? 'متابعة التصميم' : 'طلب بطاقة الدخول (VIP)'}
                </button>
            </section>

            {/* Minimal Footer */}
            <footer className="py-16 border-t border-[#f5f5f0]/5 text-center text-[#f5f5f0]/20 text-[10px] font-light tracking-[0.4em] uppercase bg-[#0a0a0a]">
                Yafa Design Studio © 2026
            </footer>
        </div>
    );
}
