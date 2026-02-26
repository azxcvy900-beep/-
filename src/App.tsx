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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateFashionImage } from './services/geminiService';

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
  { id: 'auto', name: 'وضعية تلقائية', prompt: 'An artistic, creative pose inspired by high-end global fashion brand advertisements (like Vogue, Gucci, Prada). The pose should be dynamic and visually striking.', image: 'https://picsum.photos/seed/poseauto/200/300' },
  { id: 'fashion', name: 'وقفة عرض أزياء', prompt: 'Classic fashion runway pose, standing tall and confident.', image: 'https://picsum.photos/seed/pose1/200/300' },
  { id: 'fluid', name: 'حركة انسيابية', prompt: 'Fluid, dynamic movement pose, capturing a sense of motion.', image: 'https://picsum.photos/seed/pose2/200/300' },
  { id: 'architectural', name: 'جلسة معمارية', prompt: 'Architectural sitting pose, structured and elegant.', image: 'https://picsum.photos/seed/pose3/200/300' },
  { id: 'silhouette', name: 'جانبي (سيلويت)', prompt: 'Side profile silhouette pose, emphasizing the outline and shape.', image: 'https://picsum.photos/seed/pose4/200/300' },
  { id: 'walking', name: 'مشية عفوية', prompt: 'Natural walking pose, candid and effortless.', image: 'https://picsum.photos/seed/pose5/200/300' }
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
  const [view, setView] = useState<'landing' | 'studio' | 'admin'>('landing');
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

  // Admin State
  const [adminStats, setAdminStats] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, subsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/subscriptions')
      ]);
      setAdminStats(await statsRes.json());
      setSubscriptions(await subsRes.json());
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  useEffect(() => {
    if (view === 'admin') fetchAdminData();
  }, [view]);

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
        
        const result = await generateFashionImage(img, {
          gender,
          category,
          pose: poseToUse,
          background: bgToUse,
          cameraAngle,
          modelImage: modelImage || undefined
        });
        generated.push(result);
        setResultImages([...generated]); // Update UI incrementally
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء التوليد. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (view === 'landing') {
    return (
      <div className="h-screen bg-[#0F0F0F] text-white font-sans overflow-y-auto custom-scrollbar" dir="rtl">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 space-y-4"
          >
            <h1 className="text-5xl font-bold tracking-tight">استوديو الأناقة الذكي</h1>
            <p className="text-xl text-[#888888] max-w-2xl mx-auto">حول صور ملابسك العادية إلى جلسات تصوير احترافية باستخدام أحدث تقنيات الذكاء الاصطناعي.</p>
          </motion.div>

          {/* Featured Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 w-full">
            {[
              'https://picsum.photos/seed/fashion1/800/1200',
              'https://picsum.photos/seed/fashion2/800/1200',
              'https://picsum.photos/seed/fashion3/800/1200',
              'https://picsum.photos/seed/fashion4/800/1200'
            ].map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#262626] bg-[#161616]"
              >
                <img src={src} alt={`Fashion ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('studio')}
            className="group relative px-12 py-5 bg-white text-black rounded-full font-bold text-xl flex items-center gap-3 hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            ابدأ الآن
            <Sparkles className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="h-screen bg-[#0F0F0F] text-white font-sans flex flex-col overflow-hidden" dir="rtl">
        <header className="h-14 border-b border-[#262626] flex items-center justify-between px-6 bg-[#161616]">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('landing')} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-white" />
              <span className="font-bold text-sm">لوحة تحكم الإدارة</span>
            </div>
          </div>
          <button onClick={() => setView('studio')} className="text-xs font-bold bg-white text-black px-4 py-1.5 rounded-full">
            العودة للاستوديو
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'إجمالي المستخدمين', value: adminStats?.totalUsers || 0, icon: Users },
                { label: 'إجمالي التوليدات', value: adminStats?.totalGenerations || 0, icon: Sparkles },
                { label: 'حالة الـ API', value: adminStats?.apiStatus || 'Checking...', icon: Activity, color: adminStats?.apiStatus === 'Connected' ? 'text-green-400' : 'text-red-400' },
                { label: 'المشتركين النشطين', value: adminStats?.activePlans?.find((p: any) => p.plan === 'premium')?.count || 0, icon: ShieldCheck },
              ].map((stat, i) => (
                <div key={i} className="bg-[#161616] border border-[#262626] p-6 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between opacity-40">
                    <span className="text-[10px] font-bold uppercase">{stat.label}</span>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Subscriptions Table */}
            <div className="bg-[#161616] border border-[#262626] rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-[#262626] flex items-center justify-between">
                <h3 className="font-bold text-sm">إدارة الاشتراكات</h3>
                <button onClick={fetchAdminData} className="text-[10px] font-bold text-[#888] hover:text-white uppercase">تحديث البيانات</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#1A1A1A] text-[#666] uppercase font-bold">
                    <tr>
                      <th className="px-6 py-4">المستخدم</th>
                      <th className="px-6 py-4">الباقة</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4">الاستخدام</th>
                      <th className="px-6 py-4">تاريخ الانضمام</th>
                      <th className="px-6 py-4">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {subscriptions.length > 0 ? subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium">{sub.email || 'مستخدم تجريبي'}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                            sub.plan === 'premium' ? "bg-white text-black" : "bg-[#262626] text-[#888]"
                          )}>
                            {sub.plan === 'premium' ? 'بريميوم' : 'مجانية'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "flex items-center gap-1.5",
                            sub.status === 'active' ? "text-green-400" : "text-red-400"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", sub.status === 'active' ? "bg-green-400" : "bg-red-400")} />
                            {sub.status === 'active' ? 'نشط' : 'معطل'}
                          </span>
                        </td>
                        <td className="px-6 py-4">{sub.generations_count} صورة</td>
                        <td className="px-6 py-4 opacity-40">{new Date(sub.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={async () => {
                              await fetch('/api/admin/subscriptions/toggle', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: sub.id, status: sub.status === 'active' ? 'disabled' : 'active' })
                              });
                              fetchAdminData();
                            }}
                            className="text-[10px] font-bold hover:underline"
                          >
                            {sub.status === 'active' ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-[#666]">لا يوجد مشتركين حالياً</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0F0F0F] text-white font-sans flex flex-col overflow-hidden" dir="rtl">
      {/* Top Header */}
      <header className="h-14 border-b border-[#262626] flex items-center justify-between px-6 bg-[#0F0F0F] z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('landing')} className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <Sparkles className="text-black w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">Fashion Generator</span>
          </button>
          <div className="h-4 w-[1px] bg-[#262626]" />
          <nav className="flex gap-4">
            <button className="text-xs font-medium text-white">توليد الصور</button>
            <button className="text-xs font-medium text-[#888888] hover:text-white transition-colors">المعرض</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-xs font-medium text-[#888888] hover:text-white transition-colors flex items-center gap-1">
            <Info className="w-3 h-3" />
            مساعدة
          </button>
          <button className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-all">
            ترقية
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Settings */}
        <aside className="w-[320px] border-l border-[#262626] bg-[#161616] flex flex-col overflow-hidden">
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
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">إعدادات المودل</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-[#666] block">الجنس</span>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded px-2 py-1.5 text-[11px] outline-none focus:border-[#444]"
                  >
                    <option value="female">أنثى</option>
                    <option value="male">ذكر</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-[#666] block">العمر</span>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded px-2 py-1.5 text-[11px] outline-none focus:border-[#444]"
                  >
                    <option value="adults">كبار</option>
                    <option value="youth">شباب</option>
                    <option value="kids">أطفال</option>
                  </select>
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
          </div>

          {/* Generate Button Area */}
          <div className="p-5 border-t border-[#262626] bg-[#161616]">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || clothingImages.length === 0}
              className="w-full bg-white text-black py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التوليد
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  توليد الصورة
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 bg-[#0F0F0F] relative flex flex-col">
          {/* Preview Toolbar */}
          <div className="h-12 border-b border-[#262626] flex items-center justify-between px-6 bg-[#0F0F0F]">
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
          <div className="h-10 border-t border-[#262626] flex items-center justify-between px-6 bg-[#0F0F0F]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 opacity-40">
                <Monitor className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase">1080x1350</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-40">
                <Layers className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase">AI Model: Gemini 2.5</span>
              </div>
              <button onClick={() => setView('admin')} className="flex items-center gap-1.5 opacity-20 hover:opacity-100 transition-opacity cursor-pointer">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase">الإدارة</span>
              </button>
            </div>
            <div className="flex items-center gap-2 opacity-40">
              <span className="text-[9px] font-bold uppercase">© 2026 AI Fashion Studio</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
