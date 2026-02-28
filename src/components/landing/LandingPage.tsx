"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeamVisualization } from "./BeamVisualization";
import { Footer } from "./Footer";
import { ArrowRight, Play, Menu, X, Building2, Mail, Lock, Gift, Eye, EyeOff, CheckCircle2, Loader2, Sparkles, Video, Bot, BarChart3, Wallet, UserCheck, FileText, AlertTriangle, TrendingDown, Clock, Users, PhoneOff, DollarSign, Zap, Heart, MessageCircle } from "lucide-react";
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
  icon: <PhoneOff className="w-5 h-5" />,
  title: "Пропущенные звонки",
  description: "Администратор не берёт трубку после 18:00. Клиент уходит к конкурентам.",
  stat: "–40%",
  statLabel: "потерянных заявок"
}, {
  icon: <TrendingDown className="w-5 h-5" />,
  title: "Нет аналитики",
  description: "Вы не знаете, откуда приходят клиенты и какая реклама работает.",
  stat: "?",
  statLabel: "окупаемость рекламы"
}, {
  icon: <Clock className="w-5 h-5" />,
  title: "Ручная работа",
  description: "Записи в тетради, отчёты в Excel. Ошибки неизбежны.",
  stat: "3ч",
  statLabel: "в день впустую"
}, {
  icon: <DollarSign className="w-5 h-5" />,
  title: "Деньги на ветер",
  description: "Реклама крутится, но вы не знаете — окупается она или нет.",
  stat: "–60%",
  statLabel: "бюджета впустую"
}, {
  icon: <Users className="w-5 h-5" />,
  title: "Нет контроля команды",
  description: "Администраторы работают как хотят. Никто не отслеживает качество.",
  stat: "0",
  statLabel: "контроля"
}, {
  icon: <AlertTriangle className="w-5 h-5" />,
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

  const openMarkChatbot = () => {
    toast.info("Чат-бот Марк скоро будет доступен!");
  };

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

  return <div className="min-h-screen bg-[#fafafa] overflow-x-hidden font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

    {/* Clean, Apple-like Header */}
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-white border-opacity-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
          <img
            alt="MarkVision AI"
            className="w-8 h-8 rounded-lg object-contain"
            src={markvisionLogo}
            fetchPriority="high"
          />
          <span className="font-semibold text-lg tracking-tight text-slate-800">
            MarkVision AI
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Основная навигация">
          <button onClick={() => scrollToSection("features")} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Возможности
          </button>
          <button onClick={() => scrollToSection("brand")} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            История
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/auth")} className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all rounded-full px-5">
            Войти
          </Button>
          <Button onClick={() => scrollToSection("signup")} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5 font-medium text-sm transition-all shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/20">
            Попробовать
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 rounded-full hover:bg-slate-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white/95 backdrop-blur-3xl border-t border-slate-100 px-6 py-6 space-y-4 absolute w-full shadow-xl">
          <button onClick={() => scrollToSection("features")} className="block w-full text-left text-lg font-medium text-slate-700">Возможности</button>
          <button onClick={() => scrollToSection("brand")} className="block w-full text-left text-lg font-medium text-slate-700">История</button>
          <div className="pt-4 flex flex-col gap-3">
            <Button variant="outline" onClick={() => navigate("/auth")} className="w-full rounded-2xl h-12 text-base border-slate-200">Войти</Button>
            <Button onClick={() => scrollToSection("signup")} className="w-full bg-slate-900 text-white rounded-2xl h-12 text-base">Попробовать бесплатно</Button>
          </div>
        </motion.div>
      )}
    </header>

    {/* HERO SECTION */}
    <section id="hero" ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-32 pb-16 overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-blue-100/50 via-teal-50/50 to-purple-100/50 rounded-full blur-[100px] -z-10 opacity-70" />

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/50 backdrop-blur-md border border-slate-200/60 rounded-full mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700 tracking-wide">Умная система управления клиникой</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-8">
          Хватит терять <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            клиентов.
          </span>
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="max-w-2xl mx-auto mb-12">
          <p className="text-xl sm:text-2xl text-slate-500 font-medium mb-4">
            Увеличьте выручку до <span className="text-slate-900 font-semibold">+500 000 ₸ в день</span> без дополнительного бюджета на маркетинг.
          </p>
          <p className="text-base text-slate-400">
            Мы управляем маркетингом, продажами и аналитикой — вы управляете бизнесом.
          </p>
        </motion.div>

        {/* Video Player Mockup with Premium Glass */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-4xl mx-auto mb-10">
          <div className="p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-slate-200/50">
            <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden group">

              <div className="absolute inset-0 flex items-center justify-center">
                {!videoWatched ? (
                  <button
                    onClick={handleVideoPlay}
                    disabled={isPlaying}
                    className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl transition-all hover:scale-105 hover:bg-white/20 group-hover:shadow-blue-500/20"
                  >
                    {isPlaying ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Play className="w-8 h-8 text-white ml-1" />}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 text-white px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <span className="font-medium">Демонстрация завершена</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 backdrop-blur-sm">
                <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${videoProgress}%` }} transition={{ ease: "linear" }} />
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium mt-6">
            Посмотрите 3-минутное видео, чтобы разблокировать бесплатный аудит
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex justify-center">
          <Button
            size="lg"
            onClick={openMarkChatbot}
            disabled={!videoWatched}
            className={`rounded-full px-8 py-6 text-base sm:text-lg font-semibold transition-all duration-500 ${videoWatched ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/40 hover:-translate-y-1" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
          <MessageCircle className="w-5 h-5 mr-2" />
          Забронировать аудит
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
  </div>
    </section>

  {/* FEATURES SECTION (Modules) */ }
  <section id = "features" className = "py-24 px-6 relative bg-white border-y border-slate-100/50" >
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">Всё необходимое в одном месте.</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">6 автономных модулей, которые заменяют отдел маркетинга, продаж и финансового аналитика.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, i) => (
          <div key={i} className="p-8 rounded-[2rem] bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              {module.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{module.title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm">{module.description}</p>
          </div>
        ))}
      </div>
    </div>
    </section>

  {/* PAIN POINTS */ }
  <section className = "py-24 px-6 relative bg-[#fafafa]" >
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">Ежедневные потери.</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">Проблемы, из-за которых клиники упускают до 60% чистой прибыли.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {painPoints.map((point, i) => (
          <div key={i} className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                {point.icon}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{point.stat}</div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{point.statLabel}</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{point.title}</h3>
            <p className="text-slate-500 text-sm">{point.description}</p>
          </div>
        ))}
      </div>
    </div>
    </section>

  {/* HOW IT WORKS / BEAM */ }
  <section className = "py-24 px-6 bg-white overflow-hidden border-y border-slate-100/50" >
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">Бесперебойный процесс.</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">Как искусственный интеллект проводит клиента от первого клика до дверей вашей клиники.</p>
      </div>

      <div className="rounded-[2.5rem] bg-slate-50 border border-slate-100 p-4 sm:p-8">
        <BeamVisualization />
      </div>
    </div>
    </section>

  {/* BRAND STORY */ }
  <section id = "brand" className = "py-24 px-6 bg-[#fafafa]" >
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative order-2 lg:order-1">
          <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200">
            <img src={founderImg} alt="Юрий с сыном Марком" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
            <Heart className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-600">Основано на ценностях</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Имя, которое значит больше, чем бизнес.
          </h2>
          <div className="space-y-6 text-lg text-slate-600">
            <p>
              <span className="text-slate-900 font-semibold">MarkVision</span> — это личное обязательство. Проект назван в честь моего сына Марка, что символизирует предельную ответственность за результат.
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p><span className="text-slate-900 font-medium">Личный контроль:</span> Я лично проверяю показатели каждой клиники.</p>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p><span className="text-slate-900 font-medium">Системный подход:</span> Процессы выстроены так, чтобы я мог с гордостью показать их итог сыну.</p>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <p><span className="text-slate-900 font-medium">Наследие:</span> Мы внедряем архитектуру бизнеса, на которой можно строить будущее, а не просто пускаем рекламу.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl">Ю</div>
            <div>
              <p className="font-bold text-slate-900">Юрий Запойнов</p>
              <p className="text-sm text-slate-500">Основатель MarkVision AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </section>

  {/* SIGNUP CTA */ }
  <section id = "signup" ref = { signupRef } className = "py-24 px-6 bg-white border-y border-slate-100/50" >
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">Начните бесплатно</h2>
        <p className="text-lg text-slate-500">7 дней полного доступа ко всем функциям.</p>
      </div>

      <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Название клиники</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input type="text" placeholder='Клиника "Здоровье"' value={formData.clinicName} onChange={e => handleChange('clinicName', e.target.value)} className="pl-12 rounded-2xl h-14 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:font-normal" />
            </div>
            {errors.clinicName && <p className="text-xs text-red-500 font-medium mt-1">{errors.clinicName}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input type="email" placeholder="example@clinic.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} className="pl-12 rounded-2xl h-14 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:font-normal" />
            </div>
            {errors.email && <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={e => handleChange('password', e.target.value)} className="pl-12 pr-12 rounded-2xl h-14 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:font-normal" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 font-medium mt-1">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 flex justify-between">
              <span>Промокод</span>
              <span className="text-slate-400 font-normal text-xs uppercase tracking-wider">Опционально</span>
            </label>
            <div className="relative">
              <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input type="text" placeholder="MARK7" value={formData.promoCode} onChange={e => handleChange('promoCode', e.target.value.toUpperCase())} className={`pl-12 pr-12 rounded-2xl h-14 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:font-normal ${promoValid === true ? 'border-green-400 bg-green-50/50' : promoValid === false ? 'border-red-400' : ''}`} />
              {promoValid === true && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
            </div>
            {promoValid === true && <p className="text-xs text-green-600 font-medium mt-1">Промокод MARK7 активирован!</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 transition-all hover:-translate-y-0.5 mt-4">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Создать аккаунт"}
          </Button>

          <p className="text-center text-sm text-slate-500 font-medium">
            Уже есть аккаунт? <button type="button" onClick={() => navigate('/auth')} className="text-blue-600 hover:text-blue-700 font-bold ml-1">Войти</button>
          </p>
        </form>
      </div>
    </div>
    </section>

  <Footer />
  </div >;
};
export default LandingPage;
