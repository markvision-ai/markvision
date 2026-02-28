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

// Founder image
import founderImg from "@/assets/founder-with-mark.png";

// Logo
import markvisionLogo from "@/assets/markvision-logo.png";

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
  return <div className="min-h-screen bg-[#fafafa] overflow-x-hidden font-['Inter',sans-serif]">
    {/* Premium Sticky Navbar - light */}
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-2xl border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)] safe-area-top shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <img
              alt="MarkVision AI"
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl object-cover shadow-2xl shadow-blue-900/5 shadow-blue-500/20"
              src={markvisionLogo}
              width="40"
              height="40"
              fetchPriority="high"
            />
          </div>
          <span className="font-semibold text-xs sm:text-lg text-slate-900 tracking-tight">
            <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>MarkVision AI</AuroraText>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10" aria-label="Основная навигация">
          <button onClick={() => scrollToSection("brand")} className="text-slate-600 hover:text-slate-900 font-medium transition-colors text-[15px]">
            О проекте
          </button>
          <button onClick={() => scrollToSection("modules")} className="text-slate-600 hover:text-slate-900 font-medium transition-colors text-[15px]">
            Возможности
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <Button variant="ghost" onClick={() => navigate("/auth")} className="text-slate-700 hover:text-slate-900 font-medium rounded-xl px-3 lg:px-4 text-sm lg:text-base hover:bg-white/10">
            Войти
          </Button>
          <Button onClick={() => scrollToSection("signup")} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 lg:px-5 font-medium text-sm lg:text-base shadow-2xl shadow-blue-900/5 shadow-blue-500/25 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-blue-500/30 transition-all">
            Начать бесплатно
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 -mr-2 rounded-xl hover:bg-white/10 transition-colors active:bg-white/20" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="md:hidden bg-white border-t border-slate-200 px-3 py-4 space-y-1 shadow-2xl shadow-blue-900/5">
        <button onClick={() => scrollToSection("brand")} className="block w-full text-left py-2 px-2 text-slate-600 hover:text-slate-900 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors">
          О проекте
        </button>
        <button onClick={() => scrollToSection("modules")} className="block w-full text-left py-2 px-2 text-slate-600 hover:text-slate-900 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors">
          Возможности
        </button>
        <div className="pt-3 space-y-2 px-0">
          <Button variant="outline" onClick={() => navigate("/auth")} className="w-full rounded-lg h-10 text-sm font-medium border-slate-200 text-slate-700 hover:bg-white/5 hover:text-slate-900">
            Войти в систему
          </Button>
          <Button onClick={() => scrollToSection("signup")} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg h-10 text-sm font-medium shadow-2xl shadow-blue-900/5 shadow-blue-500/25">
            Начать бесплатно
          </Button>
        </div>
      </motion.div>}
    </header>

    {/* BLOCK 1: Hero - light */}
    <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-3 sm:px-6 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-16 md:pb-20 bg-[#fafafa] overflow-hidden" aria-label="MarkVision AI — умная система для клиник">
      {/* Radial gradient orbs - subtle for light */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/15 via-blue-500/15 to-cyan-400/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

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
        }} className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-full mb-5 sm:mb-8 shadow-[0_0_20px_rgba(59,130,246,0.12)]">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          <span className="text-xs sm:text-sm font-medium text-blue-700">Умная система управления</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0,
          duration: 0.4
        }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 tracking-tight leading-[1.05] mb-8 sm:mb-12 max-w-5xl mx-auto">
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
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
              +500 000 ₸ / день
            </div>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              без дополнительного бюджета на маркетинг
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">Мы управляем маркетингом, продажами и аналитикой —</span>
              <br />
              вы управляйте бизнесом
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
            <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-cyan-400/30 via-blue-500/30 to-indigo-500/30 rounded-2xl sm:rounded-[32px] blur-3xl opacity-60 animate-pulse" />
            <BackgroundGradient containerClassName="rounded-xl sm:rounded-[32px]" className="rounded-lg sm:rounded-[28px] overflow-hidden">
              <div className="relative aspect-video bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-blue-500/10 rounded-xl sm:rounded-[28px] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {!videoWatched ? <motion.button onClick={handleVideoPlay} whileHover={{
                    scale: 1.05
                  }} whileTap={{
                    scale: 0.98
                  }} disabled={isPlaying} className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shadow-2xl shadow-black/20 group transition-all disabled:opacity-70">
                    {isPlaying ? <Loader2 className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600 animate-spin" /> : <Play className="w-7 h-7 sm:w-10 sm:h-10 text-slate-900 ml-1 sm:ml-1.5 group-hover:text-blue-600 transition-colors" />}
                  </motion.button> : <motion.div initial={{
                    scale: 0.8,
                    opacity: 0
                  }} animate={{
                    scale: 1,
                    opacity: 1
                  }} className="flex items-center gap-2 sm:gap-3 text-blue-400 px-4">
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
          <Button size="lg" onClick={openMarkChatbot} className={`relative rounded-2xl sm:rounded-3xl px-6 sm:px-12 py-4 sm:py-8 text-sm sm:text-lg font-bold shadow-2xl transition-all w-full sm:w-auto min-h-14 ${videoWatched ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:via-cyan-700 hover:to-indigo-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.03]" : "bg-white/20 text-slate-500 cursor-not-allowed"}`} disabled={!videoWatched}>
            {videoWatched && <span className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse opacity-40" />}
            <span className="relative flex items-center justify-center gap-2 sm:gap-3">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Забронировать аудит</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
          </Button>

          <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
            ⏱️ Обычно занимает 20 минут | Без обязательств
          </p>
        </motion.div>
      </div>
    </section>

    {/* BLOCK 1.5: Pain Points - light */}
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-[#fafafa] relative overflow-hidden" aria-labelledby="pain-points-heading">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-rose-400/15 via-orange-400/15 to-rose-400/15 rounded-full blur-[120px] pointer-events-none" />

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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-400/30 rounded-full mb-5 sm:mb-6">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs sm:text-sm font-medium text-red-600">Знакомо?</span>
          </div>
          <h2 id="pain-points-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">
            Эти проблемы убивают{" "}
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              вашу прибыль
            </span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto font-light px-2">
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
              }} className="h-full p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-[28px] bg-white border border-slate-200 shadow-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-red-200 transition-all cursor-default group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-400/20 flex items-center justify-center text-red-500 shrink-0">
                    {point.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">{point.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{point.description}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-red-500">{point.stat}</span>
                  <span className="text-xs sm:text-sm text-slate-500">{point.statLabel}</span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

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
          <p className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
            MarkVision решает{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">все эти проблемы</span>
          </p>
          <p className="text-sm sm:text-base text-slate-600">Автоматически. Без найма новых сотрудников.</p>
        </motion.div>
      </div>
    </section>

    {/* BLOCK 2: How it works - light */}
    <section className="py-12 sm:py-16 lg:py-20 px-6 bg-gradient-to-b from-slate-100 via-white to-slate-50" aria-labelledby="how-it-works-heading">
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
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              работает
            </span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto font-light">Система сама ведёт клиента от заявки до визита в клинику </p>
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
        }} className="rounded-[32px] overflow-hidden border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
          <BeamVisualization />
        </motion.div>
      </div>
    </section>

    {/* BLOCK 3: Brand Story - light */}
    <section id="brand" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-[#fafafa] relative overflow-hidden" aria-labelledby="brand-heading">
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-400/8 to-cyan-400/8 rounded-full blur-[150px]" style={{ animationDelay: '3s' }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <motion.div whileHover={{
              scale: 1.01
            }} transition={{
              duration: 0.3
            }} className="relative">
              <div className="aspect-[4/5] rounded-2xl sm:rounded-[32px] overflow-hidden border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
                <img src={founderImg} alt="Юрий с сыном Марком" className="w-full h-full object-cover" fetchPriority="high" />
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-400/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-indigo-400/15 rounded-full blur-3xl" />
            </motion.div>
          </div>

          <div className="order-1 lg:order-2">
            <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full mb-5 sm:mb-6">
              <Heart className="w-4 h-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-blue-700">История проекта</span>
            </motion.div>

            <h2 id="brand-heading" className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-8 leading-tight tracking-tight">
              Почему проект назван{" "}
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                в честь моего сына?
              </span>
            </h2>

            <div className="space-y-4 sm:space-y-6">
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                <span className="text-slate-900 font-semibold">MarkVision</span> — это не просто название компании, это личное обязательство. Проект назван в честь моего сына Марка, что символизирует глубину ответственности, которую я несу за каждый результат.
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                Это наш семейный стандарт качества, который я переношу в бизнес:
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                <span className="text-slate-900 font-semibold">Личный контроль:</span> Я лично проверяю результаты работы каждой клиники‑партнёра.
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                <span className="text-slate-900 font-semibold">Системный подход:</span> Мы выстраиваем процессы так, чтобы я мог с гордостью показать их итог своему сыну.
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.4 }} className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                <span className="text-slate-900 font-semibold">Наследие, а не просто услуга:</span> Мы создаём не просто рекламные кампании, а внедряем порядок, системность и устойчивые бизнес‑процессы, на которых можно строить будущее.
              </motion.p>
            </div>

            {/* Founder signature */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }} className="flex items-center gap-4 pt-3 sm:pt-4 border-t border-slate-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-2xl shadow-blue-900/5 shadow-blue-500/25">
                Ю
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm sm:text-base">Юрий Запойнов</p>
                <p className="text-xs sm:text-sm text-slate-500">Основатель MarkVision AI</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>

    {/* BLOCK 4: What's included — light */}
    <section id="modules" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-100 via-white to-slate-50 relative overflow-hidden" aria-labelledby="modules-heading">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/15 via-blue-500/15 to-cyan-400/15 rounded-full blur-[100px] pointer-events-none" style={{ animationDelay: '2s' }} />

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
        }} className="text-center mb-8 sm:mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full mb-4 sm:mb-6">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-blue-700">Что внутри MarkVision</span>
          </div>
          <h2 id="modules-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 tracking-tight text-slate-900">
            <span>6 модулей, работающих{" "}</span>
            <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
              24/7
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto font-light px-2">
            Каждый модуль автоматизирует процесс, который раньше требовал отдельного сотрудника
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
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
              delay: index * 0.08,
              duration: 0.5
            }}>
              <motion.div whileHover={{
                y: -10,
                scale: 1.02
              }} transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }} className="relative h-full group cursor-pointer" role="article" aria-label={module.title}>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-400/0 via-cyan-400/0 to-indigo-400/0 group-hover:from-blue-400/30 group-hover:via-cyan-400/30 group-hover:to-indigo-400/30 rounded-2xl sm:rounded-[28px] opacity-0 group-hover:opacity-100 transition-all duration-500" />

                <div
                  className="relative h-full p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[28px] bg-white border border-slate-200 shadow-md group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:border-blue-200 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  tabIndex={0}
                >
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-6 text-xs font-['JetBrains_Mono',monospace] tracking-wider text-slate-400 group-hover:text-blue-500 transition-all duration-500">
                    0{index + 1}
                  </div>

                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-600 mb-4 sm:mb-5 group-hover:scale-110 transition-all duration-500">
                    {module.icon}
                  </div>

                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-2 sm:mb-3">{module.title}</h3>

                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm mb-4">
                    {module.description}
                  </p>

                  <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                      <span className="font-medium">Активен 24/7</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>


    {/* BLOCK 6: Registration Form - light */}
    <section id="signup" ref={signupRef} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-[#fafafa] relative overflow-hidden" aria-label="Регистрация">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px]" style={{ animationDelay: '1s' }} />

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
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-8">
              <div className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-blue-900/5 shadow-blue-500/25">
                <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>

            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 tracking-tight text-slate-900">
              Начните бесплатно
            </h2>
            <p className="text-xs sm:text-base text-slate-600 px-2">
              7 дней доступа ко всем функциям системы
            </p>
          </div>

          <div className="relative">
            <div className="relative bg-white/10 backdrop-blur-3xl rounded-xl sm:rounded-[32px] p-4 sm:p-8 md:p-10 border border-white/60 shadow-2xl shadow-blue-500/10">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700">Название клиники</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <Input type="text" placeholder='Клиника "Здоровье"' value={formData.clinicName} onChange={e => handleChange('clinicName', e.target.value)} className={`pl-10 sm:pl-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-white/5 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 text-sm sm:text-base ${errors.clinicName ? 'border-red-500' : ''}`} />
                  </div>
                  {errors.clinicName && <p className="text-xs text-red-500 ml-1">{errors.clinicName}</p>}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <Input type="email" placeholder="email@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={`pl-10 sm:pl-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-white/5 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 text-sm sm:text-base ${errors.email ? 'border-red-500' : ''}`} />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={e => handleChange('password', e.target.value)} className={`pl-10 sm:pl-14 pr-10 sm:pr-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-white/5 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 text-sm sm:text-base ${errors.password ? 'border-red-500' : ''}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700">Промокод</label>
                  <div className="relative">
                    <Gift className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <Input type="text" placeholder="MARK7" value={formData.promoCode} onChange={e => handleChange('promoCode', e.target.value.toUpperCase())} className={`pl-10 sm:pl-14 rounded-lg sm:rounded-2xl h-11 sm:h-14 bg-white/5 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 text-sm sm:text-base ${promoValid === true ? 'border-blue-500 bg-blue-50' : ''}`} />
                    {promoValid === true && <CheckCircle2 className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
                  </div>
                  {promoValid === true && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs sm:text-sm text-blue-600 font-medium flex items-center gap-1 sm:gap-2 ml-1">
                    <span>🎉</span> Активирован доступ на 7 дней
                  </motion.p>}
                </div>

                <div className="mt-3 sm:mt-5">
                  <Button type="submit" className="relative w-full h-11 sm:h-14 rounded-lg sm:rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:via-cyan-700 hover:to-indigo-700 text-white font-semibold text-sm sm:text-lg shadow-2xl shadow-blue-900/5 shadow-blue-500/25 transition-all border-0" disabled={loading}>
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

              <div className="mt-4 sm:mt-6 text-center">
                <span className="text-xs sm:text-sm text-slate-500">Уже есть аккаунт? </span>
                <button type="button" onClick={() => navigate('/auth')} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
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
