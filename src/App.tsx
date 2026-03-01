import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  User,
  Camera,
  Image as ImageIcon,
  Loader2,
  Check,
  Sparkles,
  Download,
  Maximize2,
  Trash2,
  Settings2,
  ChevronDown,
  Info,
  Layers,
  Monitor,
  ShieldCheck,
  Users,
  Activity,
  Plus,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateFashionImage } from './services/geminiService';
import { auth, db } from './lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BACKGROUND_CATEGORIES = [
  { id: 'auto', name: 'تلقائي', options: ['عشوائي ذكي'] },
  { id: 'luxury', name: 'فخامة', options: ['بنتهاوس فاخر', 'قاعة رخامية', 'طائرة خاصة'] },
  { id: 'office', name: 'استوديو', options: ['استوديو مينيمال', 'مكتب معماري', 'معرض حديث'] },
  { id: 'nature', name: 'طبيعة', options: ['كثبان رملية', 'قمة جبلية', 'ساحل أمالفي'] },
  { id: 'advertising', name: 'إعلاني', options: ['استوديو إضاءة عالية', 'ظلال درامية', 'نيون عصري'] },
];

const POSES = [
  { id: 'auto', name: 'مجسم تلقائي ذكي', prompt: 'High-quality realistic clothing display on a professional invisible ghost mannequin, perfectly fitted, 8k resolution, photorealistic.', image: '/assets/poses/fashion.png' },
  { id: 'mannequin_realistic', name: 'مانيكان واقعي', prompt: 'Clothing displayed on a highly realistic, premium fiberglass fashion mannequin with subtle human-like features, standing straight, professional fashion photography.', image: '/assets/poses/fashion.png' },
  { id: 'mannequin_abstract', name: 'مانيكان تجريدي (بدون ملامح)', prompt: 'Clothing displayed on an abstract, faceless, elegant matte luxury mannequin, high-end visual merchandising style.', image: '/assets/poses/fluid.png' },
  { id: 'ghost_mannequin', name: 'مانيكان خفي (ثلاثي الأبعاد)', prompt: 'Clothing displayed using the invisible ghost mannequin technique, giving the garment a hollow 3D shape, perfectly ironed, e-commerce product photography.', image: '/assets/poses/architectural.png' },
  { id: 'fashion', name: 'عارض أزياء (بشري)', prompt: 'Worn by a professional human fashion model, standing tall and confident, high-end editorial runway look.', image: '/assets/poses/silhouette.png' },
  { id: 'flatlay', name: 'تصوير مسطح (Flatlay)', prompt: 'Flat lay clothing photography, garments neatly arranged on a clean premium surface, top-down view, precise lighting.', image: '/assets/poses/walking.png' }
];

const CAMERA_ANGLES = [
  'Full body shot, eye level',
  'Medium shot, slightly low angle',
  'Close-up, focused on clothing details',
  'Wide shot, showing full environment',
  'Dynamic low angle shot',
  'High angle shot, looking down'
];

export default function App() {
  const [view, setView] = useState<'landing' | 'studio' | 'admin' | 'pricing' | 'login' | 'terms' | 'privacy' | 'refund'>('landing');

  // Handle URL deep linking for Paddle verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as any;
    if (viewParam && ['landing', 'studio', 'admin', 'pricing', 'login', 'terms', 'privacy', 'refund'].includes(viewParam)) {
      setView(viewParam);
    }
  }, []);

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  const [clothingImages, setClothingImages] = useState<string[]>([]);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [category, setCategory] = useState<'kids' | 'youth' | 'adults'>('adults');
  const [selectedPose, setSelectedPose] = useState(POSES[0]);
  const [selectedBgCategory, setSelectedBgCategory] = useState(BACKGROUND_CATEGORIES[0]);
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_CATEGORIES[0].options[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);

  // Admin State
  const [adminStats, setAdminStats] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ gemini_api_key: "" });
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
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Failed to fetch initial settings", err));
  }, []);

  useEffect(() => {
    if (view === 'admin') fetchAdminData();
  }, [view]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          try {
            // Fetch user profile from Firestore
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserProfile(docSnap.data());
            } else {
              // Create new user profile for the 2 free images trial
              const newProfile = {
                email: currentUser.email,
                plan: 'trial',
                credits: 2,
                created_at: new Date().toISOString()
              };
              await setDoc(docRef, newProfile);
              setUserProfile(newProfile);
            }
          } catch (err: any) {
            console.error("Firestore Error in Auth Listener:", err);
            setUserProfile({ email: currentUser.email, plan: 'trial', credits: 0, error: 'Database Not Connected' });
          }
        } else {
          setUserProfile(null);
        }
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const handleLogout = async () => {
    await signOut(auth);
    setView('landing');
  };

  const onDropClothing = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.slice(0, 10 - clothingImages.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setClothingImages(prev => [...prev, reader.result as string].slice(0, 10));
      reader.readAsDataURL(file);
    });
  }, [clothingImages]);

  const onDropModel = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => setModelImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getClothingProps, getInputProps: getClothingInput } = useDropzone({
    onDrop: onDropClothing,
    accept: { 'image/*': [] },
    multiple: true,
    maxFiles: 10
  } as any);

  const { getRootProps: getModelProps, getInputProps: getModelInput } = useDropzone({
    onDrop: onDropModel,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const handleGenerate = async () => {
    console.log("DEBUG - handleGenerate started", { clothingCount: clothingImages.length, user: user?.uid });
    if (clothingImages.length === 0) return;
    setIsGenerating(true);
    setError(null);
    setResultImages([]);

    try {
      const generated: string[] = [];

      for (const img of clothingImages) {
        // Randomize pose if 'auto' is selected OR if isAutoMode is active
        let poseToUse = selectedPose.prompt;
        if (isAutoMode || selectedPose.id === 'auto') {
          const randomPoses = POSES.filter(p => p.id !== 'auto');
          poseToUse = randomPoses[Math.floor(Math.random() * randomPoses.length)].prompt;
        }

        // Randomize background if isAutoMode is active OR if 'auto' category is selected
        let bgToUse = selectedBg;
        if (isAutoMode || selectedBgCategory.id === 'auto') {
          const allBgs = BACKGROUND_CATEGORIES.filter(c => c.id !== 'auto').flatMap(c => c.options);
          bgToUse = allBgs[Math.floor(Math.random() * allBgs.length)];
        }

        // Randomize camera angle for variety
        const cameraAngle = CAMERA_ANGLES[Math.floor(Math.random() * CAMERA_ANGLES.length)];

        // Use the secure backend endpoint instead of the direct client-side mock
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user?.uid,
            clothingImageBase64: img,
            config: {
              apiKey: settings.gemini_api_key,
              gender,
              category,
              pose: poseToUse,
              background: bgToUse,
              cameraAngle,
              modelImage: modelImage || undefined,
              isFreeTrial: userProfile?.plan === 'trial'
            }
          })
        });

        let data;
        let isJson = response.headers.get('content-type')?.includes('application/json');

        if (isJson) {
          data = await response.json();
        }

        if (!response.ok) {
          throw new Error(data?.error || "حدث خطأ غير متوقع في الخادم (Server Error). يرجى المحاولة لاحقاً.");
        }

        generated.push(data.result);
        setResultImages([...generated]); // Update UI incrementally

        // Update local credit count based on server response
        if (data.remainingCredits !== undefined && userProfile) {
          setUserProfile({ ...userProfile, credits: data.remainingCredits });
        }
      }
    } catch (err: any) {
      console.error("Frontend Generation Error:", err);
      // Fallback: If it's a 500 error, sometimes it's because Hugging Face is loading
      const msg = err.message || "حدث خطأ";
      setError(msg.includes("500") ? "المحرك يجهز نفسه.. يرجى المحاولة ثانية بعد ثقائق." : msg);
    } finally {
      console.log("DEBUG - handleGenerate finished");
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yafa-gold animate-spin" />
      </div>
    );
  }

  if (view === 'landing') {
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

  if (view === 'admin') {
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
                onClick={() => setAdminTab(tab.id as any)}
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
                    { label: 'المشتركين النشطين', value: adminStats?.activePlans?.find((p: any) => p.plan === 'premium')?.count || 0, icon: ShieldCheck, color: 'from-yafa-gold/20 to-yafa-gold/0' },
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
                      {subscriptions.map((sub: any) => (
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
                  {packages.map((pkg: any) => (
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

  if (view === 'pricing') {
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

  if (view === 'terms' || view === 'privacy' || view === 'refund') {
    const isTerms = view === 'terms';
    const isPrivacy = view === 'privacy';
    const isRefund = view === 'refund';

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

  if (view === 'login') {
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

  return (
    <div className="h-screen bg-yafa-bg text-white font-sans flex flex-col overflow-hidden relative" dir="rtl">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(6,78,59,0.05),transparent_70%)] pointer-events-none" />

      {/* Top Header */}
      <header className="h-16 border-b border-yafa-border flex items-center justify-between px-8 bg-yafa-sidebar/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <button onClick={() => setView('landing')} className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
              <Sparkles className="text-yafa-emerald w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">يافا ديزاين</span>
          </button>
          <div className="h-6 w-[1px] bg-yafa-border" />
          <nav className="flex gap-6">
            <button className="text-sm font-semibold text-white relative after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:w-full after:h-[2px] after:bg-yafa-gold">استوديو التصميم</button>
            <button className="text-sm font-medium text-yafa-muted hover:text-white transition-colors">معرض الأعمال</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-sm font-medium text-yafa-muted hover:text-white transition-colors flex items-center gap-2">
            <Info className="w-4 h-4" />
            مركز المساعدة
          </button>
          <button
            onClick={() => setView('pricing')}
            className="bg-gradient-to-r from-yafa-gold to-yellow-500 text-black px-6 py-2 rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all"
          >
            ترقية الحساب
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Settings */}
        <aside className="w-[360px] border-l border-yafa-border bg-yafa-sidebar/20 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            {/* Split Upload Area */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">رفع الصور (حتى 10 قطع)</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Clothing Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#666]">الملابس ({clothingImages.length}/10)</span>
                    {clothingImages.length > 0 && (
                      <button onClick={() => setClothingImages([])} className="text-[#888888] hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div
                    {...getClothingProps()}
                    className={cn(
                      "relative aspect-square rounded-2xl border border-[#333] bg-[#1A1A1A] flex flex-col items-center justify-center cursor-pointer hover:border-[#444] transition-all overflow-hidden",
                      clothingImages.length > 0 && "border-white/20"
                    )}
                  >
                    <input {...getClothingInput()} />
                    {clothingImages.length > 0 ? (
                      <div className="grid grid-cols-2 w-full h-full p-1 gap-1">
                        {clothingImages.slice(0, 4).map((img, i) => (
                          <img key={i} src={img} alt="Clothing" className="w-full h-full object-cover rounded" />
                        ))}
                        {clothingImages.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-xs font-bold">+{clothingImages.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Upload className="w-5 h-5 text-[#444]" />
                    )}
                  </div>
                </div>

                {/* Model Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#666]">المودل</span>
                    {modelImage && (
                      <button onClick={() => setModelImage(null)} className="text-[#888888] hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div
                    {...getModelProps()}
                    className={cn(
                      "relative aspect-square rounded-2xl border border-[#333] bg-[#1A1A1A] flex flex-col items-center justify-center cursor-pointer hover:border-[#444] transition-all overflow-hidden",
                      modelImage && "border-white/20"
                    )}
                  >
                    <input {...getModelInput()} />
                    {modelImage ? (
                      <img src={modelImage} alt="Model" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#444]" />
                    )}
                  </div>
                </div>
              </div>
              {!modelImage && (
                <p className="text-[9px] text-[#666] text-center italic">سيتم توليد المودل تلقائياً في حال عدم الرفع</p>
              )}
            </div>

            {/* Model Settings */}
            <div className="space-y-5 bg-white/5 p-4 rounded-2xl border border-yafa-border">
              <label className="text-[11px] font-bold text-yafa-gold uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                تخصيص العارض
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-yafa-muted block font-medium">الجنس</span>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-yafa-bg border border-yafa-border rounded-xl px-3 py-2 text-xs outline-none focus:border-yafa-emerald-light/50 transition-colors"
                  >
                    <option value="female">أنثى</option>
                    <option value="male">ذكر</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-yafa-muted block font-medium">العمر</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-yafa-bg border border-yafa-border rounded-xl px-3 py-2 text-xs outline-none focus:border-yafa-emerald-light/50 transition-colors"
                  >
                    <option value="adults">كبار</option>
                    <option value="youth">شباب</option>
                    <option value="kids">أطفال</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Smart Auto Mode Toggle */}
            <button
              onClick={() => setIsAutoMode(!isAutoMode)}
              className={cn(
                "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group",
                isAutoMode
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  : "bg-[#1A1A1A] text-white border-[#333] hover:border-[#444]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isAutoMode ? "bg-black text-white" : "bg-[#262626] text-white"
                )}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold">الوضع التلقائي الذكي</p>
                  <p className={cn("text-[9px] opacity-60", isAutoMode ? "text-black" : "text-[#888]")}>توليد وضعيات وخلفيات متنوعة تلقائياً</p>
                </div>
              </div>
              <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                isAutoMode ? "bg-black" : "bg-[#333]"
              )}>
                <motion.div
                  animate={{ x: isAutoMode ? -20 : 0 }}
                  className={cn(
                    "absolute top-1 right-1 w-3 h-3 rounded-full",
                    isAutoMode ? "bg-white" : "bg-[#666]"
                  )}
                />
              </div>
            </button>

            <AnimatePresence>
              {!isAutoMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] text-[#666] block">الوضعية</span>
                    <div className="grid grid-cols-3 gap-2">
                      {POSES.map((pose) => (
                        <button
                          key={pose.id}
                          onClick={() => setSelectedPose(pose)}
                          className={cn(
                            "relative aspect-[3/4] rounded-lg border overflow-hidden transition-all group",
                            selectedPose.id === pose.id ? "border-white" : "border-[#333] hover:border-[#444]"
                          )}
                        >
                          <img
                            src={pose.image}
                            alt={pose.name}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                            <span className="text-[8px] font-bold text-white block truncate">{pose.name}</span>
                          </div>
                          {selectedPose.id === pose.id && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 text-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">البيئة والخلفية</label>

                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      {BACKGROUND_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedBgCategory(cat);
                            setSelectedBg(cat.options[0]);
                          }}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all",
                            selectedBgCategory.id === cat.id ? "bg-white text-black" : "bg-[#1A1A1A] text-[#888] border border-[#333]"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {selectedBgCategory.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedBg(option)}
                          className={cn(
                            "relative aspect-video rounded border overflow-hidden transition-all group",
                            selectedBg === option ? "border-white" : "border-[#333] hover:border-[#444]"
                          )}
                        >
                          <img
                            src={`https://picsum.photos/seed/${option}/200/112`}
                            alt={option}
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="text-[8px] font-bold text-white/80">{option}</span>
                          </div>
                          {selectedBg === option && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 text-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Generate Button Area */}
          <div className="p-6 border-t border-yafa-border bg-yafa-sidebar/40 backdrop-blur-md">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || clothingImages.length === 0}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-yafa-emerald-light hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري تصميم سحرك الخاص...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  توليد الجلسة الاحترافية
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 bg-yafa-bg relative flex flex-col">
          {/* Preview Toolbar */}
          <div className="h-14 border-b border-yafa-border flex items-center justify-between px-8 bg-yafa-bg/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">المعاينة</span>
            </div>
            <div className="flex items-center gap-2">
              {resultImages.length > 0 && (
                <>
                  <button
                    onClick={() => setResultImages([])}
                    className="p-2 hover:bg-[#1A1A1A] rounded transition-colors text-[#888888] hover:text-red-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold">مسح الكل</span>
                  </button>
                  <button
                    onClick={() => {
                      resultImages.forEach((img, i) => {
                        const link = document.createElement('a');
                        link.href = img;
                        link.download = `fashion-ai-${i}.png`;
                        link.click();
                      });
                    }}
                    className="p-2 hover:bg-[#1A1A1A] rounded transition-colors text-[#888888] hover:text-white"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Image Canvas */}
          <div className="flex-1 relative overflow-y-auto custom-scrollbar p-10">
            <AnimatePresence mode="wait">
              {isGenerating && resultImages.length === 0 ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center gap-4"
                >
                  <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                  <p className="text-xs font-medium text-[#888888]">جاري معالجة الصور...</p>
                </motion.div>
              ) : resultImages.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto"
                >
                  {resultImages.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative group aspect-[3/4] bg-[#161616] rounded-2xl overflow-hidden border border-[#262626]"
                    >
                      <img src={img} alt={`Result ${i}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = img;
                            link.download = `fashion-ai-${i}.png`;
                            link.click();
                          }}
                          className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {isGenerating && (
                    <div className="aspect-[3/4] bg-[#161616] rounded-2xl border border-[#262626] border-dashed flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#333]" />
                      <p className="text-[10px] text-[#666]">جاري توليد البقية...</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center gap-4 max-w-xs mx-auto text-center"
                >
                  <div className="w-16 h-16 bg-[#161616] border border-[#262626] rounded-2xl flex items-center justify-center mb-2">
                    <ImageIcon className="w-8 h-8 text-[#333]" />
                  </div>
                  <h3 className="text-sm font-bold">ابدأ بتوليد مجموعتك الأولى</h3>
                  <p className="text-[11px] text-[#666]">ارفع حتى 10 قطع ملابس وقم بتخصيص الإعدادات لرؤية النتائج هنا.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Bottom Info Bar */}
          <footer className="h-10 border-t border-yafa-border flex items-center justify-between px-8 bg-yafa-sidebar/20 backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 opacity-50">
                <Monitor className="w-3 h-3 text-yafa-gold" />
                <span className="text-[9px] font-bold uppercase tracking-wider">1080x1350 Output</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <Layers className="w-3 h-3 text-yafa-gold" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Gemini 2.0 Engine</span>
              </div>
              <button
                onClick={() => {
                  const pswd = prompt("الرجاء إدخال كلمة المرور للوصول إلى لوحة الإدارة:");
                  if (pswd === "yafa2026") {
                    setAdminPasswordError(null);
                    setView('admin');
                  } else if (pswd !== null) {
                    alert("كلمة المرور غير صحيحة.");
                  }
                }}
                className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">إدارة النظام</span>
              </button>
            </div>
            <div className="flex items-center gap-4 ml-auto px-4 border-l border-white/5 h-full opacity-30 hover:opacity-100 transition-opacity">
              <button onClick={() => setView('pricing')} className="text-[9px] font-bold uppercase tracking-widest hover:text-yafa-gold">Pricing</button>
              <button onClick={() => setView('terms')} className="text-[9px] font-bold uppercase tracking-widest hover:text-yafa-gold">Terms of Service</button>
              <button onClick={() => setView('privacy')} className="text-[9px] font-bold uppercase tracking-widest hover:text-yafa-gold">Privacy Policy</button>
              <button onClick={() => setView('refund')} className="text-[9px] font-bold uppercase tracking-widest hover:text-yafa-gold">Refund Policy</button>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-30">© 2026 YAFA DESIGN STUDIO</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
