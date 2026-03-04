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
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import PricingPage from './pages/PricingPage';
import LegalPage from './pages/LegalPage';
import AuthPage from './pages/AuthPage';
import { cn } from './utils/cn';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile, AdminStats, Subscription, Package } from './types';

interface GarmentAnalysis {
  isMultiple: boolean;
  pieces: { description: string, placement: "upper_body" | "lower_body" | "dresses" }[];
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

export const PREDEFINED_ACCESSORIES = [
  { id: 'sunglasses', name: 'نظارات شمسية', placement: 'eyewear', icon: '🕶️' },
  { id: 'watch', name: 'ساعة فاخرة', placement: 'jewelry', icon: '⌚' },
  { id: 'bag', name: 'حقيبة يد', placement: 'bags', icon: '👜' },
  { id: 'shoes', name: 'حذاء جلدي', placement: 'shoes', icon: '👞' },
];
const compressImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // fallback to original if canvas fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use WebP for better compression and quality for photos
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function App() {
  const [view, setView] = useState<'landing' | 'studio' | 'admin' | 'pricing' | 'login' | 'terms' | 'privacy' | 'refund'>('landing');

  // Handle URL deep linking for Paddle verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['landing', 'studio', 'admin', 'pricing', 'login', 'terms', 'privacy', 'refund'].includes(viewParam)) {
      setView(viewParam as any);
    }
  }, []);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

  const [clothingAnalysis, setClothingAnalysis] = useState<Record<string, GarmentAnalysis>>({});
  const [analyzingImages, setAnalyzingImages] = useState<Record<string, boolean>>({});
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  const toggleAccessory = (id: string) => {
    setSelectedAccessories(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Admin State
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

  const onDropClothing = useCallback(async (acceptedFiles: File[]) => {
    const filesToProcess = acceptedFiles.slice(0, 10 - clothingImages.length);
    const newImages: string[] = [];

    for (const file of filesToProcess) {
      try {
        const compressedBase64 = await compressImage(file, 1024, 1024, 0.8);
        newImages.push(compressedBase64);
      } catch (err) {
        console.error("Failed to compress clothing image", err);
      }
    }

    if (newImages.length > 0) {
      setClothingImages(prev => [...prev, ...newImages].slice(0, 10));

      // Trigger analysis for each new image
      newImages.forEach(async (img) => {
        setAnalyzingImages(prev => ({ ...prev, [img]: true }));
        try {
          const res = await fetch('/api/analyze-clothing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clothingImageBase64: img, apiKey: settings.gemini_api_key })
          });
          const data = await res.json();
          if (res.ok) {
            setClothingAnalysis(prev => ({ ...prev, [img]: data }));
          }
        } catch (err) {
          console.error("Failed to analyze image", err);
        } finally {
          setAnalyzingImages(prev => ({ ...prev, [img]: false }));
        }
      });
    }
  }, [clothingImages, settings.gemini_api_key]);

  const onDropModel = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file, 1024, 1024, 0.8);
      setModelImage(compressedBase64);
    } catch (err) {
      console.error("Failed to compress model image", err);
    }
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
    if (clothingImages.length === 0 && selectedAccessories.length === 0) return;
    setIsGenerating(true);
    setError(null);
    setResultImages([]);

    try {
      // Build items array
      const itemsToGenerate: any[] = [];

      for (const img of clothingImages) {
        const analysis = clothingAnalysis[img];
        if (analysis && analysis.pieces && analysis.pieces.length > 0) {
          for (const piece of analysis.pieces) {
            itemsToGenerate.push({
              base64: img,
              description: piece.description,
              placement: piece.placement
            });
          }
        } else {
          itemsToGenerate.push({
            base64: img,
            description: "Clothing item",
            placement: "upper_body" // default fallback
          });
        }
      }

      for (const accId of selectedAccessories) {
        const accDef = PREDEFINED_ACCESSORIES.find(a => a.id === accId);
        if (accDef) {
          itemsToGenerate.push({
            description: accDef.name,
            placement: accDef.placement
          });
        }
      }

      // Randomize pose and background
      let poseToUse = selectedPose.prompt;
      if (isAutoMode || selectedPose.id === 'auto') {
        const randomPoses = POSES.filter(p => p.id !== 'auto');
        poseToUse = randomPoses[Math.floor(Math.random() * randomPoses.length)].prompt;
      }

      let bgToUse = selectedBg;
      if (isAutoMode || selectedBgCategory.id === 'auto') {
        const allBgs = BACKGROUND_CATEGORIES.filter(c => c.id !== 'auto').flatMap(c => c.options);
        bgToUse = allBgs[Math.floor(Math.random() * allBgs.length)];
      }

      const cameraAngle = CAMERA_ANGLES[Math.floor(Math.random() * CAMERA_ANGLES.length)];

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          items: itemsToGenerate,
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

      setResultImages([data.result]);

      // Update local credit count based on server response
      if (data.remainingCredits !== undefined && userProfile) {
        setUserProfile({ ...userProfile, credits: data.remainingCredits });
      }

    } catch (err: any) {
      console.error("Frontend Generation Error:", err);
      setError(err.message || "حدث خطأ غير متوقع أثناء التوليد.");
    } finally {
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

  if (view === 'landing') return <LandingPage user={user} setView={setView} />;
  if (view === 'admin') return <AdminDashboard setView={setView} />;
  if (view === 'pricing') return <PricingPage user={user} setView={setView} />;
  if (view === 'terms' || view === 'privacy' || view === 'refund') return <LegalPage view={view} setView={setView} />;
  if (view === 'login') return <AuthPage setView={setView} />;

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

              {/* Analysis Summary */}
              {clothingImages.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {clothingImages.map((img, i) => {
                    const isAnalyzing = analyzingImages[img];
                    const analysis = clothingAnalysis[img];
                    return (
                      <div key={i} className="flex gap-2 p-2 bg-black/20 rounded-xl border border-[#333] items-center">
                        <img src={img} className="w-8 h-8 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          {isAnalyzing ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-[#888]">
                              <Loader2 className="w-3 h-3 animate-spin text-yafa-gold" />
                              <span>يتم تحليل القطعة بالذكاء الاصطناعي...</span>
                            </div>
                          ) : analysis ? (
                            <div className="space-y-1">
                              {analysis.isMultiple ? (
                                <p className="text-[9px] text-yellow-500 font-bold flex items-center gap-1">
                                  ⚠️ يحتوي الطقم على أكثر من قطعة، قد تقل دقة التوليد.
                                </p>
                              ) : null}
                              {analysis.pieces.map((p, idx) => (
                                <p key={idx} className="text-[10.5px] text-white truncate flex items-center gap-1.5">
                                  <span className="text-yafa-gold/80">
                                    {p.placement === 'upper_body' ? '👕 علوي' : p.placement === 'lower_body' ? '👖 سفلي' : '👗 فستان'}
                                  </span>
                                  <span className="text-white/60 mx-1">|</span>
                                  <span className="truncate">{p.description}</span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-red-400">فشل في التحليل، سيتم الاعتماد على الذكاء التلقائي.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Model Settings */}
            <div className="space-y-5 bg-white/5 p-4 rounded-2xl border border-yafa-border relative">
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
                    disabled={modelImage !== null}
                    className="w-full bg-yafa-bg border border-yafa-border rounded-xl px-3 py-2 text-xs outline-none focus:border-yafa-emerald-light/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={modelImage !== null}
                    className="w-full bg-yafa-bg border border-yafa-border rounded-xl px-3 py-2 text-xs outline-none focus:border-yafa-emerald-light/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="adults">كبار</option>
                    <option value="youth">شباب</option>
                    <option value="kids">أطفال</option>
                  </select>
                </div>
              </div>

              {modelImage && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-2xl flex items-center justify-center p-4">
                  <p className="text-[11px] font-bold text-yafa-gold text-center bg-black/80 px-4 py-2 rounded-xl border border-yafa-gold/30">
                    تم قفل الخيارات لأنك قمت برفع مودل مخصص.
                  </p>
                </div>
              )}
            </div>

            {/* Accessories Selection */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-yafa-border">
              <label className="text-[11px] font-bold text-yafa-gold uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                إضافات وإكسسوارات
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PREDEFINED_ACCESSORIES.map(acc => {
                  const isSelected = selectedAccessories.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      onClick={() => toggleAccessory(acc.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all text-xs text-right",
                        isSelected
                          ? "bg-yafa-gold/10 border-yafa-gold text-white"
                          : "bg-black/20 border-[#333] text-[#aaa] hover:border-[#555]"
                      )}
                    >
                      <span className="text-xl">{acc.icon}</span>
                      <span className="font-medium">{acc.name}</span>
                    </button>
                  );
                })}
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
