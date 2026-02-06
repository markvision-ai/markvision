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
import { ArrowRight, Play, Menu, X, Building2, Mail, Lock, Gift, Eye, EyeOff, CheckCircle2, Loader2, Sparkles, Video, Bot, BarChart3, Wallet, UserCheck, FileText, MessageCircle, AlertTriangle, TrendingDown, Clock, Users, PhoneOff, DollarSign, Zap, Quote, Heart } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { z } from "zod";
import founderWithMark from "@/assets/founder-with-mark.png";
const modules = [{
  title: "Контент за вас",
  description: "200+ постов и видео в месяц. Мы сами придумываем, снимаем и публикуем. Вам не нужен SMM-специалист.",
  icon: <Video className="w-6 h-6" />
}, {
  title: "Запись 24/7",
  description: "Бот отвечает клиентам в любое время: консультирует, отвечает на вопросы и записывает на приём.",
  icon: <Bot className="w-6 h-6" />
}, {
  title: "Понятная аналитика",
  description: "Видите откуда пришёл каждый клиент и сколько принёс денег. Всё просто и наглядно.",
  icon: <BarChart3 className="w-6 h-6" />
}, {
  title: "Учёт финансов",
  description: "Все доходы и расходы в одном месте. Прямо в телефоне. Никаких таблиц Excel.",
  icon: <Wallet className="w-6 h-6" />
}, {
  title: "Контроль команды",
  description: "Система следит за работой администраторов: кто как отвечает, кто записал больше клиентов.",
  icon: <UserCheck className="w-6 h-6" />
}, {
  title: "Отчёты каждый день",
  description: "Каждое утро получаете отчёт: сколько записей, сколько денег, что улучшить.",
  icon: <FileText className="w-6 h-6" />
}];

const painPoints = [{
  icon: <PhoneOff className="w-6 h-6" />,
  title: "Пропущенные звонки",
  description: "Администратор не берёт трубку после 18:00. Клиент уходит к конкурентам.",
  stat: "–40%",
  statLabel: "потерянных заявок"
}, {
  icon: <TrendingDown className="w-6 h-6" />,
  title: "Нет аналитики",
  description: "Вы не знаете, откуда приходят клиенты и какая реклама работает.",
  stat: "0₸",
  statLabel: "понимания ROI"
}, {
  icon: <Clock className="w-6 h-6" />,
  title: "Ручная работа",
  description: "Записи в тетради, отчёты в Excel, напоминания в голове. Ошибки неизбежны.",
  stat: "3ч",
  statLabel: "в день впустую"
}, {
  icon: <DollarSign className="w-6 h-6" />,
  title: "Деньги на ветер",
  description: "Реклама крутится, но вы не знаете — окупается она или нет.",
  stat: "–60%",
  statLabel: "бюджета впустую"
}, {
  icon: <Users className="w-6 h-6" />,
  title: "Нет контроля команды",
  description: "Администраторы работают как хотят. Никто не отслеживает качество.",
  stat: "0",
  statLabel: "контроля"
}, {
  icon: <AlertTriangle className="w-6 h-6" />,
  title: "Нет контента",
  description: "Соцсети пустые. Клиенты не доверяют клинике без онлайн-присутствия.",
  stat: "–70%",
  statLabel: "доверия"
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
            <img alt="MarkVision AI" className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl object-cover shadow-lg shadow-blue-500/25" src="/lovable-uploads/3263a132-db41-45fb-80ef-e0dddeb8aebc.png" />
            <span className="font-semibold text-xs sm:text-lg text-slate-900 tracking-tight">
              <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>MarkVision AI</AuroraText>
            </span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10" aria-label="Основная навигация">
            <button onClick={() => scrollToSection("brand")} className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]">
              О проекте
            </button>
            <button onClick={() => scrollToSection("modules")} className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]">
              Возможности
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-slate-600 hover:text-slate-900 font-medium rounded-xl px-3 lg:px-4 text-sm lg:text-base">
              Войти
            </Button>
            <Button onClick={() => scrollToSection("signup")} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 lg:px-5 font-medium text-sm lg:text-base shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 transition-all">
              Начать бесплатно
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 -mr-2 rounded-xl hover:bg-slate-100 transition-colors active:bg-slate-200" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={mobileMenuOpen}>
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
      }} className="md:hidden bg-white border-t border-slate-100 px-3 py-4 space-y-1">
            <button onClick={() => scrollToSection("brand")} className="block w-full text-left py-2 px-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              О проекте
            </button>
            <button onClick={() => scrollToSection("modules")} className="block w-full text-left py-2 px-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
              Возможности
            </button>
            <div className="pt-3 space-y-2 px-0">
              <Button variant="outline" onClick={() => navigate("/auth")} className="w-full rounded-lg h-10 text-sm font-medium border-slate-200">
                Войти в систему
              </Button>
              <Button onClick={() => scrollToSection("signup")} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 text-sm font-medium">
                Начать бесплатно
              </Button>
            </div>
          </motion.div>}
      </header>

      {/* BLOCK 1: Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-3 sm:px-6 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-16 md:pb-20 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden" aria-label="MarkVision AI — умная система для клиник">
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
            <span className="text-xs sm:text-sm font-medium text-blue-700">Умная система управления</span>
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
        }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1.05] mb-8 sm:mb-12 max-w-5xl mx-auto">
            <div>Хватит терять</div>
            <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>
              клиентов
            </AuroraText>
          </motion.h1>

          {/* Value Proposition */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2,
          duration: 0.6
        }} className="max-w-2xl mx-auto mb-10 sm:mb-16 space-y-4">
            <div className="space-y-3">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                Увеличьте выручку на
              </p>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                +500 000 ₸ / день
              </div>
              <p className="text-sm sm:text-base text-slate-500 font-medium">
                без дополнительного бюджета на маркетинг
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-slate-700 leading-relaxed">
                <span className="font-semibold">Мы управляем маркетингом, продажами и аналитикой —</span>
                <br />
                вы концентрируетесь на клиентах
              </p>
            </div>
          </motion.div>

          {/* VSL Video with BackgroundGradient */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.35,
          duration: 0.7
        }} className="w-full max-w-3xl mx-auto mb-8 sm:mb-12 px-0 sm:px-0">
            <div className="relative">
              <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-indigo-500/20 rounded-2xl sm:rounded-[32px] blur-2xl opacity-40 animate-pulse" />
              <BackgroundGradient containerClassName="rounded-xl sm:rounded-[32px]" className="rounded-lg sm:rounded-[28px] overflow-hidden">
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
            </div>
            
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-slate-600 text-xs sm:text-sm font-medium mt-4 sm:mt-6">
              👉 Посмотрите видео (3 мин) и получите доступ к полной демонстрации
            </motion.p>
          </motion.div>

          {/* CTA Button */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.55,
          duration: 0.6
        }} className="flex flex-col items-center justify-center gap-4 px-2 sm:px-0 w-full">
            <Button size="lg" onClick={openMarkChatbot} className={`relative rounded-2xl sm:rounded-3xl px-6 sm:px-12 py-4 sm:py-8 text-sm sm:text-lg font-bold shadow-2xl transition-all w-full sm:w-auto min-h-14 ${videoWatched ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:via-cyan-700 hover:to-indigo-700 text-white shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-[1.03]" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`} disabled={!videoWatched}>
              {videoWatched && <span className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse opacity-40" />}
              <span className="relative flex items-center justify-center gap-2 sm:gap-3">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Забронировать аудит</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
            </Button>
            
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
              ⏱️ Обычно занимает 20 минут | Без обязательств
            </p>
          </motion.div>
        </div>
      </section>

      {/* BLOCK 1.5: Pain Points */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-red-50/20 to-white relative overflow-hidden" aria-labelledby="pain-points-heading">
        {/* Background accent */}
        <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-red-100/30 to-orange-100/30 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
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
        }} className="text-center mb-10 sm:mb-14 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full mb-5 sm:mb-6">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs sm:text-sm font-medium text-red-600">Знакомо?</span>
            </div>
            <h2 id="pain-points-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">
              Эти проблемы убивают{" "}
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                вашу прибыль
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-500 max-w-2xl mx-auto font-light px-2">
              Каждый день без системы — это потерянные клиенты и деньги
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {painPoints.map((point, index) => (
              <motion.div key={point.title} initial={{
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
                y: -6,
                scale: 1.02
              }} transition={{
                duration: 0.3
              }} className="h-full p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-[24px] bg-white border border-red-100/80 shadow-md hover:shadow-xl hover:shadow-red-100/40 hover:border-red-200 transition-all cursor-default group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center text-red-500 shrink-0 group-hover:from-red-100 group-hover:to-orange-100 transition-colors">
                      {point.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 group-hover:text-red-600 transition-colors">{point.title}</h3>
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{point.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-bold text-red-500">{point.stat}</span>
                    <span className="text-xs sm:text-sm text-slate-400">{point.statLabel}</span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* CTA after pain points */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.4,
          duration: 0.5
        }} className="text-center mt-6 sm:mt-8">
            <p className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
              MarkVision решает{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">все эти проблемы</span>
            </p>
            <p className="text-sm sm:text-base text-slate-400">Автоматически. Без найма новых сотрудников.</p>
          </motion.div>
        </div>
      </section>

      {/* BLOCK 2: How it works */}
      <section className="py-12 sm:py-16 lg:py-20 px-6 bg-white" aria-labelledby="how-it-works-heading">
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
        }} className="text-center mb-12">
            <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              Как это{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                работает
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-500 max-w-2xl mx-auto font-light">Система сама ведёт клиента от заявки до визита в клинику </p>
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
      <section id="brand" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-50/80 to-white" aria-labelledby="brand-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            {/* Photo */}
            <div className="order-2 lg:order-1">
              <motion.div whileHover={{
              scale: 1.01
            }} transition={{
              duration: 0.3
            }} className="relative">
                <div className="aspect-[4/5] rounded-2xl sm:rounded-[32px] overflow-hidden border border-slate-200/50 shadow-xl sm:shadow-2xl shadow-slate-200/40">
                  <img src={founderWithMark} alt="Юрий с сыном Марком" className="w-full h-full object-cover" loading="lazy" />
                </div>
                {/* Decorative elements - hidden on mobile */}
                <div className="hidden sm:block absolute -top-6 -right-6 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl" />
                <div className="hidden sm:block absolute -bottom-6 -left-6 w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl" />
              </motion.div>
            </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2">
              {/* Section label */}
              <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-5 sm:mb-6">
                <Heart className="w-4 h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-blue-700">История проекта</span>
              </motion.div>

              <h2 id="brand-heading" className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-8 leading-tight tracking-tight">
                Почему проект назван{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  в честь моего сына?
                </span>
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed">
                  <span className="text-slate-900 font-semibold">MarkVision</span> — это не просто название компании, это личное обязательство. Проект назван в честь моего сына Марка, что символизирует глубину ответственности, которую я несу за каждый результат.
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed">
                  Это наш семейный стандарт качества, который я переношу в бизнес:
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed">
                  <span className="text-slate-900 font-semibold">Личный контроль:</span> Я лично проверяю результаты работы каждой клиники‑партнёра.
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed">
                  <span className="text-slate-900 font-semibold">Системный подход:</span> Мы выстраиваем процессы так, чтобы я мог с гордостью показать их итог своему сыну.
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed">
                  <span className="text-slate-900 font-semibold">Наследие, а не просто услуга:</span> Мы создаём не просто рекламные кампании, а внедряем порядок, системность и устойчивые бизнес‑процессы, на которых можно строить будущее.
                </motion.p>
              </div>

                {/* Founder signature */}
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }} className="flex items-center gap-4 pt-3 sm:pt-4 border-t border-slate-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25">
                    Ю
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm sm:text-base">Юрий Запойнов</p>
                    <p className="text-xs sm:text-sm text-slate-400">Основатель MarkVision AI</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
      </section>

      {/* BLOCK 4: What's included — "6 модулей, работающих 24/7" */}
      <section id="modules" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-slate-50/50 to-white relative overflow-hidden" aria-labelledby="modules-heading">
        {/* Background effects */}
        <div className="hidden sm:block absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[150px] pointer-events-none" />
        <div className="hidden sm:block absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
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
        }} className="text-center mb-8 sm:mb-10 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-4 sm:mb-5">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-blue-700">Что внутри MarkVision</span>
            </div>
            <h2 id="modules-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 tracking-tight">
              <span className="text-slate-900">6 модулей, работающих{" "}</span>
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                24/7
              </span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-500 max-w-2xl mx-auto font-light px-2">
              Каждый модуль автоматизирует процесс, который раньше требовал отдельного сотрудника
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {modules.map((module, index) => (
              <motion.div key={module.title} initial={{
              opacity: 0,
              y: 30
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1,
              duration: 0.5
            }}>
                <motion.div whileHover={{
                y: -8,
                scale: 1.03
              }} transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }} className="relative h-full group cursor-pointer" role="article" aria-label={module.title}>
                  {/* Glow border on hover */}
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-400/0 via-cyan-400/0 to-indigo-400/0 group-hover:from-blue-400/40 group-hover:via-cyan-400/40 group-hover:to-indigo-400/40 rounded-2xl sm:rounded-[24px] blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500" />

                  <div
                    className="relative h-full p-4 sm:p-5 lg:p-7 rounded-2xl sm:rounded-[24px] bg-white border border-slate-200/80 shadow-md group-hover:shadow-xl group-hover:shadow-blue-100/50 group-hover:border-blue-200/80 transition-all duration-500 focus:outline-none focus:shadow-[inset_0_0_12px_rgba(59,130,246,.25)] focus:border-blue-300/70"
                    tabIndex={0}
                  >
                    {/* Module number */}
                    <div className="absolute top-4 right-4 sm:top-5 sm:right-5 text-xs font-['JetBrains_Mono',monospace] tracking-wider text-slate-300 group-hover:text-blue-400/60 transition-colors">
                      0{index + 1}
                    </div>

                    {/* Icon */}
                    <div className="w-11 h-11 sm:w-13 sm:h-13 lg:w-16 lg:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center text-blue-600 mb-4 sm:mb-5 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:border-blue-200/80 group-hover:shadow-lg group-hover:shadow-blue-100/50 transition-all duration-500">
                      {module.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">{module.title}</h3>

                    {/* Description */}
                    <p className="text-slate-500 leading-relaxed text-xs sm:text-sm group-hover:text-slate-600 transition-colors duration-300">
                      {module.description}
                    </p>

                    {/* Bottom accent line */}
                    <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 group-hover:border-blue-100 transition-colors duration-500">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400 group-hover:text-blue-500 transition-colors duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Активен 24/7</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* BLOCK 6: Registration Form - Neon Style */}
      <section id="signup" ref={signupRef} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-slate-950 relative overflow-hidden" aria-label="Регистрация">
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
            <div className="text-center mb-6 sm:mb-10">
              {/* Neon Icon */}
              <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl sm:rounded-3xl blur-xl opacity-60 animate-pulse" />
                <div className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)]">
                  <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
              
              <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 tracking-tight bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                Начните бесплатно
              </h2>
              <p className="text-xs sm:text-base text-slate-400 px-2">
                7 дней доступа ко всем функциям системы
              </p>
            </div>

            {/* Neon Form Card */}
            <div className="relative group">
              {/* Neon Glow Border */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl sm:rounded-[32px] opacity-75 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-500" />
              <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl sm:rounded-[32px] opacity-50" />
              
              <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-[32px] p-4 sm:p-8 md:p-10 border border-white/10">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                  {/* Clinic Name */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Название клиники</label>
                    <div className="relative group/input">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-lg sm:rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur-sm transition-opacity" />
                      <div className="relative">
                        <Building2 className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type="text" placeholder='Клиника "Здоровье"' value={formData.clinicName} onChange={e => handleChange('clinicName', e.target.value)} className={`pl-10 sm:pl-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${errors.clinicName ? 'border-red-500/50' : ''}`} />
                      </div>
                    </div>
                    {errors.clinicName && <p className="text-xs text-red-400 ml-1">{errors.clinicName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Email</label>
                    <div className="relative group/input">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-lg sm:rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur-sm transition-opacity" />
                      <div className="relative">
                        <Mail className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type="email" placeholder="email@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={`pl-10 sm:pl-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${errors.email ? 'border-red-500/50' : ''}`} />
                      </div>
                    </div>
                    {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Пароль</label>
                    <div className="relative group/input">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-lg sm:rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur-sm transition-opacity" />
                      <div className="relative">
                        <Lock className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={e => handleChange('password', e.target.value)} className={`pl-10 sm:pl-14 pr-10 sm:pr-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${errors.password ? 'border-red-500/50' : ''}`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors p-1">
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password}</p>}
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-cyan-300/90">Промокод</label>
                    <div className="relative group/input">
                      <div className={`absolute -inset-[1px] rounded-lg sm:rounded-2xl blur-sm transition-opacity ${promoValid === true ? 'bg-gradient-to-r from-emerald-500/50 to-green-500/50 opacity-100' : 'bg-gradient-to-r from-cyan-500/50 to-blue-500/50 opacity-0 group-focus-within/input:opacity-100'}`} />
                      <div className="relative">
                        <Gift className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400/60" />
                        <Input type="text" placeholder="MARK7" value={formData.promoCode} onChange={e => handleChange('promoCode', e.target.value.toUpperCase())} className={`pl-10 sm:pl-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-slate-800/80 text-sm sm:text-base transition-all ${promoValid === true ? 'border-emerald-500/50 bg-emerald-950/30' : ''}`} />
                        {promoValid === true && <CheckCircle2 className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                      </div>
                    </div>
                    {promoValid === true && <motion.p initial={{
                    opacity: 0,
                    y: -5
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} className="text-xs sm:text-sm text-emerald-400 font-medium flex items-center gap-1 sm:gap-2 ml-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                        <span>🎉</span> Активирован доступ на 7 дней
                      </motion.p>}
                  </div>

                  {/* Neon Submit Button */}
                  <div className="relative group/btn mt-3 sm:mt-5">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg sm:rounded-2xl opacity-75 blur-sm group-hover/btn:opacity-100 group-hover/btn:blur-md transition-all" />
                    <Button type="submit" className="relative w-full h-11 sm:h-14 rounded-lg sm:rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white font-semibold text-sm sm:text-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all border-0" disabled={loading}>
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
                <div className="mt-4 sm:mt-6 text-center">
                  <span className="text-xs sm:text-sm text-slate-500">Уже есть аккаунт? </span>
                  <button onClick={() => navigate('/auth')} className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
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
