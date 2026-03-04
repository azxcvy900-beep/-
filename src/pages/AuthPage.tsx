import React, { useState } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface Props {
    setView: (view: 'landing' | 'studio' | 'admin' | 'pricing' | 'login' | 'terms' | 'privacy' | 'refund') => void;
}

export default function AuthPage({ setView }: Props) {
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setError(null);
        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, authEmail, authPassword);
            } else {
                await createUserWithEmailAndPassword(auth, authEmail, authPassword);
            }
            setView('studio');
        } catch (err: any) {
            setError(err.message || "حدث خطأ في المصادقة");
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#030303] text-white flex items-center justify-center relative p-6" dir="rtl">
            <div className="absolute inset-0 z-0">
                <img src="/images/2.png" alt="Background" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-[#030303]/40" />
            </div>

            <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl z-10 relative">
                <button onClick={() => setView('landing')} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                </button>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="text-yafa-gold w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">{isLoginMode ? 'مرحباً بعودتك' : 'ابدأ تجربتك المجانية'}</h2>
                    <p className="text-sm text-white/50">{isLoginMode ? 'سجل دخولك لاستكمال إبداعاتك' : 'احصل على صورتين احترافيتين مجاناً الآن'}</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2 block">البريد الإلكتروني</label>
                            <input
                                type="email"
                                required
                                value={authEmail}
                                onChange={e => setAuthEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yafa-gold focus:ring-1 focus:ring-yafa-gold/20 outline-none transition-all"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2 block">كلمة المرور</label>
                            <input
                                type="password"
                                required
                                value={authPassword}
                                onChange={e => setAuthPassword(e.target.value)}
                                minLength={6}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yafa-gold focus:ring-1 focus:ring-yafa-gold/20 outline-none transition-all"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={authLoading}
                        type="submit"
                        className="w-full py-4 bg-yafa-gold text-black hover:bg-yellow-400 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب مجاني')}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-white/50 border-t border-white/10 pt-6">
                    {isLoginMode ? 'لا تملك حساباً؟' : 'لديك حساب بالفعل؟'}{' '}
                    <button onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }} className="text-yafa-gold font-bold hover:underline">
                        {isLoginMode ? 'أنشئ حسابك مجاناً' : 'سجل الدخول'}
                    </button>
                </div>
            </div>
        </div>
    );
}
