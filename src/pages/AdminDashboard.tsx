import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Activity, Users, Layers, Settings2, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { AdminStats, Subscription, Package } from '../types';

interface Props {
    setView: (view: 'landing' | 'studio' | 'admin' | 'pricing' | 'login' | 'terms' | 'privacy' | 'refund') => void;
}

export default function AdminDashboard({ setView }: Props) {
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [settings, setSettings] = useState<{ gemini_api_key?: string }>({ gemini_api_key: "" });
    const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'packages' | 'settings'>('dashboard');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const fetchAdminData = async () => {
        try {
            const [statsRes, subsRes, packsRes, settingsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/subscriptions'),
                fetch('/api/admin/packages'),
                fetch('/api/admin/settings')
            ]);
            setAdminStats(await statsRes.json());
            setSubscriptions(await subsRes.json());
            setPackages(await packsRes.json());
            setSettings(await settingsRes.json());
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    return (
        <div className="h-screen bg-[#05070a] text-white font-sans flex flex-col overflow-hidden" dir="rtl">
            <header className="h-16 border-b border-yafa-border flex items-center justify-between px-6 bg-yafa-sidebar/40 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button onClick={() => setView('landing')} className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-yafa-gold" />
                        <div>
                            <h1 className="font-bold text-sm tracking-tight text-white">منصة إدارة يافا</h1>
                            <p className="text-[10px] text-yafa-muted uppercase tracking-widest font-bold">Yafa Admin OS 2.0</p>
                        </div>
                    </div>
                </div>

                <nav className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
                    {[
                        { id: 'dashboard', label: 'الإحصائيات', icon: Activity },
                        { id: 'users', label: 'المستخدمين', icon: Users },
                        { id: 'packages', label: 'الباقات', icon: Layers },
                        { id: 'settings', label: 'الإعدادات', icon: Settings2 },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setAdminTab(tab.id as 'dashboard' | 'users' | 'packages' | 'settings')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all",
                                adminTab === tab.id ? "bg-white text-black shadow-lg" : "text-yafa-muted hover:text-white"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <button onClick={() => setView('studio')} className="text-xs font-bold bg-yafa-emerald text-white px-6 py-2 rounded-xl hover:bg-yafa-emerald/80 transition-all border border-yafa-emerald/20">
                    العودة للاستوديو
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(6,78,59,0.05),transparent_50%)]">
                <div className="max-w-6xl mx-auto space-y-8">
                    {adminTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'إجمالي المستخدمين', value: adminStats?.totalUsers || 0, icon: Users, color: 'from-blue-500/20 to-blue-500/0' },
                                    { label: 'إجمالي التوليدات', value: adminStats?.totalGenerations || 0, icon: Sparkles, color: 'from-purple-500/20 to-purple-500/0' },
                                    { label: 'حالة الربط', value: adminStats?.apiStatus || 'Checking...', icon: Activity, color: 'from-green-500/20 to-green-500/0', statusColor: adminStats?.apiStatus === 'Connected' ? 'text-green-400' : 'text-red-400' },
                                    { label: 'المشتركين النشطين', value: adminStats?.activePlans?.find((p: { plan: string, count: number }) => p.plan === 'premium')?.count || 0, icon: ShieldCheck, color: 'from-yafa-gold/20 to-yafa-gold/0' },
                                ].map((stat, i) => (
                                    <div key={i} className={cn("relative overflow-hidden bg-yafa-sidebar/40 border border-yafa-border p-6 rounded-3xl space-y-4 backdrop-blur-xl group")}>
                                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", stat.color)} />
                                        <div className="relative flex items-center justify-between">
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                <stat.icon className="w-5 h-5 text-yafa-muted" />
                                            </div>
                                            <span className="text-[10px] font-bold text-yafa-muted uppercase tracking-widest leading-none">{stat.label}</span>
                                        </div>
                                        <p className={cn("relative text-4xl font-bold tracking-tight", stat.statusColor)}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {adminTab === 'users' && (
                        <div className="bg-yafa-sidebar/40 border border-yafa-border rounded-3xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-yafa-border flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">إدارة المشتركين</h3>
                                    <p className="text-xs text-yafa-muted mt-1">تحكم في صلاحيات الوصول والحسابات</p>
                                </div>
                                <button onClick={fetchAdminData} className="flex items-center gap-2 text-[10px] font-bold bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
                                    <Activity className="w-3 h-3" />
                                    تحديث القائمة
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm">
                                    <thead>
                                        <tr className="text-yafa-muted text-[10px] font-bold uppercase tracking-widest border-b border-yafa-border">
                                            <th className="px-8 py-5">المستخدم</th>
                                            <th className="px-8 py-5">الباقة</th>
                                            <th className="px-8 py-5">الحالة</th>
                                            <th className="px-8 py-5">الاستخدام</th>
                                            <th className="px-8 py-5">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-yafa-border/50">
                                        {subscriptions.map((sub: Subscription) => (
                                            <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-yafa-emerald/20 flex items-center justify-center font-bold text-[10px] text-yafa-emerald-light uppercase">
                                                            {sub.email?.substring(0, 2) || "AN"}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{sub.email || 'مستخدم مجهول'}</p>
                                                            <p className="text-[10px] text-yafa-muted">تم الانضمام: {new Date(sub.created_at).toLocaleDateString('ar-EG')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 font-mono text-xs">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-bold uppercase",
                                                        sub.plan === 'premium' ? "bg-yafa-gold text-black" : "bg-yafa-border text-yafa-muted"
                                                    )}>
                                                        {sub.plan === 'premium' ? 'بريميوم' : 'مجانية'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-2 text-[11px] font-bold",
                                                        sub.status === 'active' ? "text-green-400" : "text-red-400"
                                                    )}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", sub.status === 'active' ? "bg-green-400" : "bg-red-400")} />
                                                        {sub.status === 'active' ? 'نشط' : 'معطل'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 font-bold tabular-nums">
                                                    {sub.generations_count} <span className="text-[10px] text-yafa-muted font-normal mr-1">صورة</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <button
                                                        onClick={async () => {
                                                            await fetch('/api/admin/subscriptions/toggle', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id: sub.id, status: sub.status === 'active' ? 'disabled' : 'active' })
                                                            });
                                                            fetchAdminData();
                                                        }}
                                                        className="text-[10px] font-bold px-4 py-2 bg-white/5 rounded-xl hover:bg-white text-black transition-all"
                                                    >
                                                        {sub.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {adminTab === 'packages' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-2xl">باقات الاشتراك</h3>
                                    <p className="text-sm text-yafa-muted mt-1">تخصيص العروض والمزايا لكل فئة</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const name = prompt("اسم الباقة الجديد:");
                                        if (name) {
                                            fetch('/api/admin/packages/add', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name, price: 0, limit: 100 })
                                            }).then(() => fetchAdminData());
                                        }
                                    }}
                                    className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-2xl font-bold text-xs hover:bg-yafa-gold transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة باقة جديدة
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {packages.map((pkg: Package) => (
                                    <div key={pkg.id} className="bg-yafa-sidebar/40 border border-yafa-border rounded-3xl p-8 backdrop-blur-xl space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    if (confirm("هل أنت متأكد من حذف هذه الباقة؟")) {
                                                        fetch('/api/admin/packages/delete', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ id: pkg.id })
                                                        }).then(() => fetchAdminData());
                                                    }
                                                }}
                                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-bold">{pkg.name}</h4>
                                            <p className="text-3xl font-bold tabular-nums">${pkg.price}<span className="text-xs text-yafa-muted font-normal mr-1">/ شهرياً</span></p>
                                        </div>
                                        <div className="space-y-3 pt-4 border-t border-yafa-border/30">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-yafa-muted">حد التوليد:</span>
                                                <span className="font-bold">{pkg.limit} صورة</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-yafa-muted">نوع الدعم:</span>
                                                <span className="font-bold">أولوية متوسطة</span>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 bg-white/5 border border-yafa-border rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">تعديل المزايا</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {adminTab === 'settings' && (
                        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-yafa-sidebar/40 border border-yafa-border rounded-3xl p-8 backdrop-blur-xl space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-yafa-gold/10 rounded-2xl flex items-center justify-center">
                                        <Settings2 className="w-6 h-6 text-yafa-gold" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">إعدادات النظام الذكي</h3>
                                        <p className="text-xs text-yafa-muted">إدارة مفاتيح الـ API والمتغيرات الحيوية</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-yafa-muted uppercase tracking-widest block">Gemini API Key</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={settings.gemini_api_key}
                                                onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                                                placeholder="أدخل مفتاح جوجل هنا..."
                                                className="w-full bg-black/40 border border-yafa-border rounded-2xl px-5 py-4 text-xs font-mono focus:border-yafa-gold focus:ring-1 focus:ring-yafa-gold/20 outline-none transition-all"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", settings.gemini_api_key ? "bg-green-400" : "bg-red-400")} />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-yafa-muted italic">يتم تشفير المفتاح وتخزينه في Firebase Firestore بشكل آمن.</p>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            disabled={isSavingSettings}
                                            onClick={async () => {
                                                setIsSavingSettings(true);
                                                await fetch('/api/admin/settings/update', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(settings)
                                                });
                                                fetchAdminData();
                                                setIsSavingSettings(false);
                                                alert("تم حفظ الإعدادات بنجاح!");
                                            }}
                                            className="w-full bg-white text-black py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-yafa-gold transition-all disabled:opacity-50"
                                        >
                                            {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                            حفظ كافة التغييرات
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
