"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { BeamVisualization } from "./BeamVisualization";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { Footer } from "./Footer";
import { AuroraText } from "@/components/ui/aurora-text";
import { ArrowRight, Play, Menu, X, Building2, Mail, Lock, Gift, Eye, EyeOff, CheckCircle2, Loader2, Sparkles, Video, Bot, BarChart3, Wallet, UserCheck, FileText, Shield, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/externalSupabase";
import { toast } from "sonner";
import { z } from "zod";
import founderWithMark from "@/assets/founder-with-mark.png";
import markvisionLogo from "@/assets/markvision-logo.png";
const modules = [{
  title: "Контент за вас",
  description: "200+ постов и видео в месяц. Мы сами придумываем, снимаем и публикуем. Вам не нужен SMM-специалист.",
  icon: <Video className="w-6 h-6" />
}, {
  title: "Запись 24/7",
  description: "Бот отвечает пациентам в любое время: консультирует, отвечает на вопросы и записывает на приём.",
  icon: <Bot className="w-6 h-6" />
}, {
  title: "Понятная аналитика",
  description: "Видите откуда пришёл каждый пациент и сколько принёс денег. Всё просто и наглядно.",
  icon: <BarChart3 className="w-6 h-6" />
}, {
  title: "Учёт финансов",
  description: "Все доходы и расходы в одном месте. Прямо в телефоне. Никаких таблиц Excel.",
  icon: <Wallet className="w-6 h-6" />
}, {
  title: "Контроль команды",
  description: "Система следит за работой администраторов: кто как отвечает, кто записал больше пациентов.",
  icon: <UserCheck className="w-6 h-6" />
}, {
  title: "Отчёты каждый день",
  description: "Каждое утро получаете отчёт: сколько записей, сколько денег, что улучшить.",
  icon: <FileText className="w-6 h-6" />
}];

// Validation schema
const signupSchema = z.object({
  clinicName: z.string().min(2, 'Название клиники должно быть минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
  promoCode: z.string().optional()
});
export const LandingPage = () => {
  const navigate = useNavigate();
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);

  // Registration form state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: '',
    email: '',
    password: '',
    promoCode: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth"
    });
    setMobileMenuOpen(false);
  };

  // Simulate video progress
  const handleVideoPlay = () => {
    setIsPlaying(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setVideoProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setVideoWatched(true);
        setIsPlaying(false);
      }
    }, 100);
  };

  // Open chatbot Mark
  const openMarkChatbot = () => {
    toast.info("Чат-бот Марк скоро будет доступен!");
  };

  // Validate promo code
  useEffect(() => {
    if (formData.promoCode.toUpperCase() === 'MARK7') {
      setPromoValid(true);
    } else if (formData.promoCode.length > 0) {
      setPromoValid(false);
    } else {
      setPromoValid(null);
    }
  }, [formData.promoCode]);
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const {
        data: signUpData,
        error: signUpError
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            clinic_name: formData.clinicName,
            promo_code: formData.promoCode.toUpperCase() === 'MARK7' ? 'MARK7' : null
          }
        }
      });
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('Этот email уже зарегистрирован. Попробуйте войти.');
        } else {
          toast.error('Ошибка регистрации: ' + signUpError.message);
        }
        return;
      }
      if (signUpData.session && signUpData.user) {
        const {
          data: projectData,
          error: projectError
        } = await supabase.from('projects').insert({
          name: formData.clinicName,
          owner_id: signUpData.user.id
        }).select().single();
        if (projectData) {
          await supabase.from('project_access').insert({
            user_id: signUpData.user.id,
            project_id: projectData.id
          });
        }
        toast.success(promoValid ? '🎉 7 дней бесплатного доступа активировано!' : 'Регистрация успешна!');
        navigate('/');
        return;
      }
      if (signUpData.user && !signUpData.session) {
        toast.info('Проверьте почту для подтверждения регистрации');
      }
    } catch (error: any) {
      toast.error('Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-white overflow-x-hidden font-['Inter',sans-serif]">
      {/* Premium Sticky Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-b border-slate-100/50 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={markvisionLogo} alt="MarkVision AI" className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover shadow-lg shadow-blue-500/25" />
            <span className="font-semibold text-sm sm:text-xl text-slate-900 tracking-tight">
              <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>MarkVision AI</AuroraText>
            </span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            <button onClick={() => scrollToSection("brand")} className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]">
              О проекте
            </button>
            <button onClick={() => scrollToSection("modules")} className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]">
              Возможности
            </button>
            <button onClick={() => scrollToSection("guarantee")} className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]">
              Гарантия
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-slate-600 hover:text-slate-900 font-medium rounded-2xl px-4 lg:px-5">
              Войти
            </Button>
            <Button onClick={() => scrollToSection("signup")} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-5 lg:px-6 font-medium shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 transition-all">
              Начать бесплатно
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 -mr-2 rounded-xl hover:bg-slate-100 transition-colors active:bg-slate-200" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="md:hidden bg-white border-t border-slate-100 px-4 py-6 space-y-2">
            <button onClick={() => scrollToSection("brand")} className="block w-full text-left py-3 px-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-base transition-colors">
              О проекте
            </button>
            <button onClick={() => scrollToSection("modules")} className="block w-full text-left py-3 px-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-base transition-colors">
              Возможности
            </button>
            <button onClick={() => scrollToSection("guarantee")} className="block w-full text-left py-3 px-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-base transition-colors">
              Гарантия
            </button>
            <div className="pt-4 space-y-3 px-1">
              <Button variant="outline" onClick={() => navigate("/auth")} className="w-full rounded-2xl h-12 text-base font-medium border-slate-200">
                Войти в систему
              </Button>
              <Button onClick={() => scrollToSection("signup")} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 text-base font-medium">
                Начать бесплатно
              </Button>
            </div>
          </motion.div>}
      </header>

      {/* BLOCK 1: Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        {/* Subtle gradient orbs - hidden on mobile for performance */}
        <div className="hidden sm:block absolute top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/40 to-indigo-100/40 rounded-full blur-3xl opacity-60" />
        <div className="hidden sm:block absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-100/30 to-blue-100/30 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-50 rounded-full mb-5 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-blue-700">Умная система для клиник</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1,
          duration: 0.7
        }} className="sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-5 sm:mb-8 text-5xl">
            Хватит терять
            <br />
            <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>
              пациентов
            </AuroraText>
          </motion.h1>

          {/* Subheadline */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2,
          duration: 0.6
        }} className="max-w-3xl mx-auto mb-6 sm:mb-10 md:mb-12 space-y-3 sm:space-y-5 px-2 sm:px-6">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-500 leading-relaxed sm:leading-loose">Мы берём на себя маркетинг, продажи и аналитику. Вы занимаетесь пациентами.<br className="hidden sm:block" />
              ​
            </p>
            <p className="text-xl sm:text-xl md:text-2xl font-semibold text-slate-800">
              Увеличьте выручку на
              <br />
              <span className="text-blue-600">+500 000 ₸ в день</span>
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-400">
              без дополнительного бюджета
            </p>
          </motion.div>

          {/* VSL Video with BackgroundGradient */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.3,
          duration: 0.7
        }} className="w-full max-w-3xl mx-auto mb-8 sm:mb-12 px-1 sm:px-0">
            <BackgroundGradient containerClassName="rounded-2xl sm:rounded-[32px]" className="rounded-xl sm:rounded-[28px] overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-[28px] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {!videoWatched ? <motion.button onClick={handleVideoPlay} whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.98
                }} disabled={isPlaying} className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl shadow-black/20 group transition-all disabled:opacity-70">
                      {isPlaying ? <Loader2 className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600 animate-spin" /> : <Play className="w-7 h-7 sm:w-10 sm:h-10 text-slate-900 ml-1 sm:ml-1.5 group-hover:text-blue-600 transition-colors" />}
                    </motion.button> : <motion.div initial={{
                  scale: 0.8,
                  opacity: 0
                }} animate={{
                  scale: 1,
                  opacity: 1
                }} className="flex items-center gap-2 sm:gap-3 text-emerald-400 px-4">
                      <CheckCircle2 className="w-6 h-6 sm:w-10 sm:h-10" />
                      <span className="text-sm sm:text-xl font-semibold">Видео просмотрено!</span>
                    </motion.div>}
                </div>
                
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-slate-700/50">
                  <motion.div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" initial={{
                  width: 0
                }} animate={{
                  width: `${videoProgress}%`
                }} transition={{
                  ease: "linear"
                }} />
                </div>

                {/* Video thumbnail overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </BackgroundGradient>
            
            <p className="text-center text-slate-400 text-xs sm:text-sm mt-3 sm:mt-5">Посмотрите видео, чтобы получить доступ</p>
          </motion.div>

          {/* CTA Button */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5,
          duration: 0.6
        }} className="flex flex-col items-center justify-center gap-4 px-2 sm:px-0">
            <Button size="lg" onClick={openMarkChatbot} className={`relative rounded-2xl sm:rounded-3xl px-6 sm:px-10 py-6 sm:py-8 text-base sm:text-lg font-semibold shadow-2xl transition-all w-full sm:w-auto ${videoWatched ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02]" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`} disabled={!videoWatched}>
              {videoWatched && <span className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse opacity-30" />}
              <span className="relative flex items-center justify-center gap-2 sm:gap-3">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Забронировать аудит</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* BLOCK 2: How it works */}
      <section className="py-24 lg:py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Как это{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                работает
              </span>
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">Система сама ведёт пациента от заявки до визита в клинику </p>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          scale: 0.96
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.7
        }} className="rounded-[32px] overflow-hidden border border-slate-200/80 shadow-2xl shadow-slate-200/50 bg-white">
            <BeamVisualization />
          </motion.div>
        </div>
      </section>

      {/* BLOCK 3: Brand Story */}
      <section id="brand" className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.7
        }} className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            {/* Photo */}
            <div className="order-2 lg:order-1">
              <motion.div whileHover={{
              scale: 1.01
            }} transition={{
              duration: 0.3
            }} className="relative">
                <div className="aspect-[4/5] rounded-2xl sm:rounded-[32px] overflow-hidden border border-slate-200/50 shadow-xl sm:shadow-2xl shadow-slate-200/40">
                  <img src={founderWithMark} alt="Юрий с сыном Марком" className="w-full h-full object-cover" />
                </div>
                {/* Decorative elements - hidden on mobile */}
                <div className="hidden sm:block absolute -top-6 -right-6 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl" />
                <div className="hidden sm:block absolute -bottom-6 -left-6 w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl" />
              </motion.div>
            </div>
            
            {/* Text Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 sm:mb-10 leading-tight tracking-tight">
                Почему я назвал проект{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  в честь сына?
                </span>
              </h2>
              <div className="space-y-4 sm:space-y-6 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                <p>
                  Проект MarkVision назван в честь моего сына Марка. Для меня это не просто бизнес — <span className="text-slate-900 font-medium">это наследие</span>.
                </p>
                <p>
                  Я лично отвечаю за результат каждой клиники, которая работает с нами. Я строю эту систему так, чтобы за неё не было стыдно перед сыном.
                </p>
                <blockquote className="text-lg sm:text-xl lg:text-2xl font-medium text-slate-900 border-l-4 border-blue-500 pl-4 sm:pl-6 py-2 italic">
                  «Мы не просто настраиваем рекламу — мы наводим порядок в вашем бизнесе»
                </blockquote>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BLOCK 4: What's included */}
      <section id="modules" className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight text-3xl">
              Что входит в{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                систему
              </span>
            </h2>
            <p className="sm:text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto font-light px-4 text-base">
              Всё, что нужно для роста вашей клиники — в одном месте
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {modules.map((module, index) => <motion.div key={module.title} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.08,
            duration: 0.5
          }}>
                <motion.div whileHover={{
              y: -8,
              scale: 1.02
            }} transition={{
              duration: 0.3
            }} className="h-full p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[28px] bg-white border border-slate-200/80 shadow-md sm:shadow-lg shadow-slate-100/50 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-blue-100/50 hover:border-blue-200/80 transition-all cursor-pointer group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 mb-4 sm:mb-5 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                    {module.icon}
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors">{module.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-xs sm:text-sm lg:text-base">
                    {module.description}
                  </p>
                </motion.div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* BLOCK 5: Guarantee */}
      <section id="guarantee" className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
        {/* Background decorations - hidden on mobile */}
        <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-100/40 to-green-100/40 rounded-full blur-3xl opacity-60 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.7
        }} className="relative">
            {/* Premium card wrapper */}
            
          </motion.div>
        </div>
      </section>

      {/* BLOCK 6: Registration Form - Neon Style */}
      <section id="signup" ref={signupRef} className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 bg-slate-950 relative overflow-hidden">
        {/* Neon Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{
          animationDelay: '1s'
        }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        <div className="max-w-xl mx-auto relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <div className="text-center mb-8 sm:mb-12">
              {/* Neon Icon */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl sm:rounded-3xl blur-xl opacity-60 animate-pulse" />
                <div className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)]">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-5 tracking-tight bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                Начните бесплатно
              </h2>
              <p className="text-sm sm:text-lg text-slate-400 px-4">
                7 дней доступа ко всем функциям системы
              </p>
            </div>

            {/* Neon Form Card */}
            <div className="relative group">
              {/* Neon Glow Border */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl sm:rounded-[32px] opacity-75 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-500" />
              <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl sm:rounded-[32px] opacity-50" />
              
              <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-[32px] p-5 sm:p-8 md:p-10 border border-white/10">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Clinic Name */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Название клиники</label>
                    <div className="relative group/input">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl sm:rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur-sm transition-opacity" />
                      <div className="relative">
                        <Building2 className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type="text" placeholder='Клиника "Здоровье"' value={formData.clinicName} onChange={e => handleChange('clinicName', e.target.value)} className={`pl-11 sm:pl-14 rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${errors.clinicName ? 'border-red-500/50' : ''}`} />
                      </div>
                    </div>
                    {errors.clinicName && <p className="text-xs text-red-400 ml-1">{errors.clinicName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Email</label>
                    <div className="relative group/input">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl sm:rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur-sm transition-opacity" />
                      <div className="relative">
                        <Mail className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type="email" placeholder="email@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={`pl-11 sm:pl-14 rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${errors.email ? 'border-red-500/50' : ''}`} />
                      </div>
                    </div>
                    {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Пароль</label>
                    <div className="relative group/input">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl sm:rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur-sm transition-opacity" />
                      <div className="relative">
                        <Lock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={e => handleChange('password', e.target.value)} className={`pl-11 sm:pl-14 pr-11 sm:pr-14 rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${errors.password ? 'border-red-500/50' : ''}`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password}</p>}
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Промокод</label>
                    <div className="relative group/input">
                      <div className={`absolute -inset-[1px] rounded-xl sm:rounded-2xl blur-sm transition-opacity ${promoValid === true ? 'bg-gradient-to-r from-emerald-500/50 to-green-500/50 opacity-100' : 'bg-gradient-to-r from-cyan-500/50 to-blue-500/50 opacity-0 group-focus-within/input:opacity-100'}`} />
                      <div className="relative">
                        <Gift className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type="text" placeholder="MARK7" value={formData.promoCode} onChange={e => handleChange('promoCode', e.target.value.toUpperCase())} className={`pl-11 sm:pl-14 rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${promoValid === true ? 'border-emerald-500/50 bg-emerald-950/30' : ''}`} />
                        {promoValid === true && <CheckCircle2 className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                      </div>
                    </div>
                    {promoValid === true && <motion.p initial={{
                    opacity: 0,
                    y: -5
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} className="text-xs sm:text-sm text-emerald-400 font-medium flex items-center gap-1.5 sm:gap-2 ml-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                        <span>🎉</span> Активирован бесплатный доступ на 7 дней
                      </motion.p>}
                  </div>

                  {/* Neon Submit Button */}
                  <div className="relative group/btn mt-2 sm:mt-4">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl sm:rounded-2xl opacity-75 blur-sm group-hover/btn:opacity-100 group-hover/btn:blur-md transition-all" />
                    <Button type="submit" className="relative w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white font-semibold text-base sm:text-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all border-0" disabled={loading}>
                      {loading ? <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                          Регистрация...
                        </> : <>
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Зарегистрироваться
                        </>}
                    </Button>
                  </div>
                </form>

                {/* Login Link */}
                <div className="mt-6 sm:mt-8 text-center">
                  <span className="text-sm sm:text-base text-slate-500">Уже есть аккаунт? </span>
                  <button onClick={() => navigate('/auth')} className="text-sm sm:text-base text-cyan-400 hover:text-cyan-300 font-medium transition-colors drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                    Войти
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Professional Footer */}
      <Footer />
    </div>;
};
export default LandingPage;