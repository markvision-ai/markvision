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
import { 
  ArrowRight, 
  Play, 
  Menu,
  X,
  Building2,
  Mail,
  Lock,
  Gift,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Sparkles,
  Video,
  Bot,
  BarChart3,
  Wallet,
  UserCheck,
  FileText,
  Shield,
  MessageCircle
} from "lucide-react";
import { supabase } from "@/lib/externalSupabase";
import { toast } from "sonner";
import { z } from "zod";
import founderWithMark from "@/assets/founder-with-mark.png";
import markvisionLogo from "@/assets/markvision-logo.png";

const modules = [
  {
    title: "Контент-Завод",
    description: "200+ публикаций в месяц. ИИ берёт на себя всё: от идей до монтажа. Доминируйте в соцсетях без SMM-штата.",
    icon: <Video className="w-6 h-6" />,
  },
  {
    title: "Воронка 24/7",
    description: "ИИ-ассистент, который сам консультирует, обрабатывает возражения и записывает на приём круглосуточно.",
    icon: <Bot className="w-6 h-6" />,
  },
  {
    title: "Сквозная аналитика",
    description: "Прозрачный путь от показа Reels до чека в кассе. Контроль ROI каждого тенге в реальном времени.",
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    title: "Умная CRM",
    description: "PnL-отчёты и учёт каждой копейки в вашем телефоне. Больше никаких Excel-таблиц.",
    icon: <Wallet className="w-6 h-6" />,
  },
  {
    title: "ИИ-РОП",
    description: "Автоматический контроль работы персонала. Анализ переписок, звонков и постановка задач 24/7.",
    icon: <UserCheck className="w-6 h-6" />,
  },
  {
    title: "Авто-Отчёты",
    description: "Глубокая аналитика за 1 секунду. Ежедневные разборы показателей и прогнозы роста от ИИ.",
    icon: <FileText className="w-6 h-6" />,
  },
];

// Validation schema
const signupSchema = z.object({
  clinicName: z.string().min(2, 'Название клиники должно быть минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
  promoCode: z.string().optional(),
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
    promoCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoValid, setPromoValid] = useState<boolean | null>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            clinic_name: formData.clinicName,
            promo_code: formData.promoCode.toUpperCase() === 'MARK7' ? 'MARK7' : null,
          },
        },
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
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.clinicName,
            owner_id: signUpData.user.id,
          })
          .select()
          .single();

        if (projectData) {
          await supabase.from('project_access').insert({
            user_id: signUpData.user.id,
            project_id: projectData.id,
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

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-['Inter',sans-serif]">
      {/* Premium Sticky Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={markvisionLogo} 
              alt="MarkVision AI" 
              className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-blue-500/25"
            />
            <span className="font-semibold text-xl text-slate-900 hidden sm:block tracking-tight">
              <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>MarkVision AI</AuroraText>
            </span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            <button 
              onClick={() => scrollToSection("brand")}
              className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]"
            >
              О проекте
            </button>
            <button 
              onClick={() => scrollToSection("modules")}
              className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]"
            >
              Модули
            </button>
            <button 
              onClick={() => scrollToSection("guarantee")}
              className="text-slate-500 hover:text-slate-900 font-medium transition-colors text-[15px]"
            >
              Гарантия
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
              className="text-slate-600 hover:text-slate-900 font-medium rounded-2xl px-5"
            >
              Войти
            </Button>
            <Button 
              onClick={() => scrollToSection("signup")}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 font-medium shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 transition-all"
            >
              Начать бесплатно
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-2xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-100 px-6 py-8 space-y-4"
          >
            <button 
              onClick={() => scrollToSection("brand")}
              className="block w-full text-left py-3 text-slate-700 hover:text-slate-900 font-medium text-lg"
            >
              О проекте
            </button>
            <button 
              onClick={() => scrollToSection("modules")}
              className="block w-full text-left py-3 text-slate-700 hover:text-slate-900 font-medium text-lg"
            >
              Модули
            </button>
            <button 
              onClick={() => scrollToSection("guarantee")}
              className="block w-full text-left py-3 text-slate-700 hover:text-slate-900 font-medium text-lg"
            >
              Гарантия
            </button>
            <div className="pt-4 space-y-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/auth")}
                className="w-full rounded-2xl h-14 text-base font-medium border-slate-200"
              >
                Войти в систему
              </Button>
              <Button 
                onClick={() => scrollToSection("signup")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 text-base font-medium"
              >
                Начать бесплатно
              </Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* BLOCK 1: Hero - WOW Effect */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/40 to-indigo-100/40 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-100/30 to-blue-100/30 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Автономная система для клиник</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-8"
          >
            Хватит терять
            <br />
            <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>
              пациентов
            </AuroraText>
          </motion.h1>

          {/* Subheadline - Improved structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-3xl mx-auto mb-12 space-y-4"
          >
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">MarkVision AI</span> — первая автономная система 
              <br className="hidden sm:block" />
              управления прибылью для клиник.
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-slate-800">
              Увеличьте выручку на <span className="text-blue-600">+500 000 ₸ в день</span>
            </p>
            <p className="text-base sm:text-lg text-slate-400">
              без вложений в рекламу
            </p>
          </motion.div>

          {/* VSL Video with BackgroundGradient */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="w-full max-w-3xl mx-auto mb-12"
          >
            <BackgroundGradient containerClassName="rounded-[32px]" className="rounded-[28px] overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {!videoWatched ? (
                    <motion.button 
                      onClick={handleVideoPlay}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isPlaying}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl shadow-black/20 group transition-all disabled:opacity-70"
                    >
                      {isPlaying ? (
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                      ) : (
                        <Play className="w-10 h-10 text-slate-900 ml-1.5 group-hover:text-blue-600 transition-colors" />
                      )}
                    </motion.button>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-3 text-emerald-400"
                    >
                      <CheckCircle2 className="w-10 h-10" />
                      <span className="text-xl font-semibold">Видео просмотрено!</span>
                    </motion.div>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-700/50">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${videoProgress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>

                {/* Video thumbnail overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </BackgroundGradient>
            
            <p className="text-center text-slate-400 text-sm mt-5">
              Посмотрите видео, чтобы разблокировать доступ
            </p>
          </motion.div>

          {/* CTA Button - Massive with pulse */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={openMarkChatbot}
              className={`relative rounded-3xl px-10 py-8 text-lg font-semibold shadow-2xl transition-all w-full sm:w-auto ${
                videoWatched
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              disabled={!videoWatched}
            >
              {videoWatched && (
                <span className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse opacity-30" />
              )}
              <span className="relative flex items-center gap-3">
                <MessageCircle className="w-5 h-5" />
                Забронировать аудит
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* BLOCK 2: Animated Beam - Autonomous Cycle */}
      <section className="py-24 lg:py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Автономный цикл{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                прибыли
              </span>
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
              Система сама превращает трафик в деньги — без вашего участия
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-[32px] overflow-hidden border border-slate-200/80 shadow-2xl shadow-slate-200/50 bg-white"
          >
            <BeamVisualization />
          </motion.div>
        </div>
      </section>

      {/* BLOCK 3: Brand Story - Personal Touch */}
      <section id="brand" className="py-24 lg:py-32 px-6 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
          >
            {/* Photo */}
            <div className="order-2 lg:order-1">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="aspect-[4/5] rounded-[32px] overflow-hidden border border-slate-200/50 shadow-2xl shadow-slate-200/40">
                  <img 
                    src={founderWithMark} 
                    alt="Юрий с сыном Марком" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl" />
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl" />
              </motion.div>
            </div>
            
            {/* Text Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-10 leading-tight tracking-tight">
                Почему я назвал проект{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  в честь сына?
                </span>
              </h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Проект MarkVision назван в честь моего сына Марка. Для меня это не просто бизнес — <span className="text-slate-900 font-medium">это наследие</span>.
                </p>
                <p>
                  Я лично отвечаю за результат каждой клиники, которая работает с нами. Я строю эту систему так, чтобы за неё не было стыдно перед сыном.
                </p>
                <blockquote className="text-2xl font-medium text-slate-900 border-l-4 border-blue-500 pl-6 py-2 italic">
                  «Мы не просто настраиваем рекламу — мы наводим порядок в вашем бизнесе»
                </blockquote>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BLOCK 4: 6 Modules Grid */}
      <section id="modules" className="py-24 lg:py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              6 модулей{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                системы
              </span>
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
              Полный набор инструментов для масштабирования вашей клиники
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="h-full p-6 sm:p-8 rounded-[28px] bg-white border border-slate-200/80 shadow-lg shadow-slate-100/50 hover:shadow-2xl hover:shadow-blue-100/50 hover:border-blue-200/80 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 mb-5 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                    {module.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{module.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm sm:text-base">
                    {module.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCK 5: Guarantee - The Trust */}
      <section id="guarantee" className="py-24 lg:py-32 px-6 bg-gradient-to-b from-slate-50 to-slate-100/80">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 mx-auto flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-8 tracking-tight">
              100% Гарантия{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                результата
              </span>
            </h2>
            
            <div className="space-y-6 text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-12">
              <p>
                Мы берём на себя <span className="text-slate-900 font-semibold">полную ответственность</span> за ваш результат.
              </p>
              <p>
                Если в течение первого месяца работы вы не увидите прироста записей и выручки — <span className="text-emerald-600 font-semibold">мы продолжим работать бесплатно</span>, пока не достигнем целевых показателей.
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                Ваш риск — ноль. Наша ответственность — максимальная.
              </p>
            </div>

            <Button
              size="lg"
              onClick={openMarkChatbot}
              className="rounded-3xl px-12 py-7 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:scale-[1.02] transition-all"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Связаться с Марком
            </Button>
          </motion.div>
        </div>
      </section>

      {/* BLOCK 6: Registration Form */}
      <section id="signup" ref={signupRef} className="py-24 lg:py-32 px-6 bg-white">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/25 w-[72px] h-[72px]">
                <Sparkles className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
                Начните бесплатно
              </h2>
              <p className="text-lg text-slate-500">
                7 дней полного доступа ко всем функциям системы
              </p>
            </div>

            <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-slate-200/60 border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Clinic Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Название клиники</label>
                  <div className="relative">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder='Клиника "Здоровье"'
                      value={formData.clinicName}
                      onChange={(e) => handleChange('clinicName', e.target.value)}
                      className={`pl-14 rounded-2xl h-14 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-base ${errors.clinicName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.clinicName && <p className="text-xs text-red-500 ml-1">{errors.clinicName}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`pl-14 rounded-2xl h-14 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-base ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={`pl-14 pr-14 rounded-2xl h-14 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-base ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
                </div>

                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Промокод</label>
                  <div className="relative">
                    <Gift className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="MARK7"
                      value={formData.promoCode}
                      onChange={(e) => handleChange('promoCode', e.target.value.toUpperCase())}
                      className={`pl-14 rounded-2xl h-14 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-base ${promoValid === true ? 'border-emerald-500 bg-emerald-50/50' : ''}`}
                    />
                    {promoValid === true && (
                      <CheckCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  {promoValid === true && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-emerald-600 font-medium flex items-center gap-2 ml-1"
                    >
                      <span>🎉</span> Активирован бесплатный доступ на 7 дней
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-lg mt-4 shadow-lg shadow-slate-900/15 hover:shadow-xl hover:shadow-slate-900/20 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Регистрация...
                    </>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <span className="text-slate-500">Уже есть аккаунт? </span>
                <button
                  onClick={() => navigate('/auth')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Войти
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Professional Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
