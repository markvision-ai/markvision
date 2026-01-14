"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LampContainer, LampContainerMini } from "@/components/ui/lamp";
import { BackgroundGradient, BackgroundGradientLight } from "@/components/ui/background-gradient";
import { BeamVisualization } from "./BeamVisualization";
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
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const modules = [
  {
    number: "01",
    title: "Контент-Завод",
    description: "200+ публикаций в месяц. ИИ берет на себя всё: от идей до монтажа. Доминируйте в соцсетях без SMM-штата.",
    icon: "🎬",
  },
  {
    number: "02",
    title: "Воронка 24/7",
    description: "ИИ-ассистент, который сам консультирует, обрабатывает возражения и записывает на приём 24/7.",
    icon: "🤖",
  },
  {
    number: "03",
    title: "Сквозная аналитика",
    description: "Прозрачный путь от показа Reels до чека в кассе. Контроль ROI каждого тенге в реальном времени.",
    icon: "📊",
  },
  {
    number: "04",
    title: "Умная CRM и Финансы",
    description: "PnL-отчеты и учет каждой копейки в вашем телефоне. Больше никаких Excel-таблиц.",
    icon: "💰",
  },
  {
    number: "05",
    title: "ИИ-РОП",
    description: "Автоматический контроль работы персонала. Анализ переписок, звонков и постановка задач 24/7.",
    icon: "👁️",
  },
  {
    number: "06",
    title: "Автоматические отчеты",
    description: "Глубокая аналитика за 1 секунду. Ежедневные разборы показателей и прогнозы роста от ИИ.",
    icon: "📈",
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
  const heroRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
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
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setVideoProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setVideoWatched(true);
      }
    }, 100);
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
        // Create project
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Sticky Navbar - Apple Style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-xl text-slate-900 hidden sm:block">MarkVision AI</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection("brand")}
              className="text-slate-500 hover:text-slate-900 font-medium transition-colors"
            >
              О проекте
            </button>
            <button 
              onClick={() => scrollToSection("modules")}
              className="text-slate-500 hover:text-slate-900 font-medium transition-colors"
            >
              Модули
            </button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Вход в систему
            </Button>
            <Button 
              onClick={() => scrollToSection("signup")}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 font-medium"
            >
              Начать бесплатно 7 дней
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-100 px-4 py-6 space-y-4"
          >
            <button 
              onClick={() => scrollToSection("brand")}
              className="block w-full text-left py-2 text-slate-600 hover:text-slate-900 font-medium"
            >
              О проекте
            </button>
            <button 
              onClick={() => scrollToSection("modules")}
              className="block w-full text-left py-2 text-slate-600 hover:text-slate-900 font-medium"
            >
              Модули
            </button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="w-full rounded-full"
            >
              Вход в систему
            </Button>
            <Button 
              onClick={() => scrollToSection("signup")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full"
            >
              Начать бесплатно 7 дней
            </Button>
          </motion.div>
        )}
      </header>

      {/* Block 1: Hero with Lamp Effect + VSL */}
      <section ref={heroRef}>
        <LampContainer className="pt-20">
          <motion.h1
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="mt-8 bg-gradient-to-br from-slate-100 to-slate-400 py-4 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl"
          >
            Хватит терять пациентов
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.5,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="mt-6 max-w-3xl text-center text-lg md:text-xl text-slate-300 px-4"
          >
            MarkVision AI — первая автономная система управления прибылью для клиник. 
            Увеличьте выручку на +500 000 ₸ в день без вложений в рекламу.
          </motion.p>
          
          {/* VSL Video Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-10 w-full max-w-3xl px-4"
          >
            <div className="bg-slate-900/50 backdrop-blur rounded-3xl p-1 border border-slate-700/50">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800/80">
                <div className="absolute inset-0 flex items-center justify-center">
                  {!videoWatched ? (
                    <button 
                      onClick={handleVideoPlay}
                      className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 group border border-white/20"
                    >
                      <Play className="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircle2 className="w-8 h-8" />
                      <span className="text-lg font-medium">Видео просмотрено!</span>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${videoProgress}%` }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-center text-slate-400 text-sm mt-4">
              Посмотрите видео, чтобы разблокировать 7 дней бесплатного доступа
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              onClick={() => scrollToSection("signup")}
              disabled={!videoWatched}
              className={`rounded-full px-8 py-6 text-lg font-semibold shadow-xl transition-all ${
                videoWatched
                  ? "bg-white text-slate-900 hover:bg-slate-100 shadow-white/20 hover:scale-105"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Начать бесплатно 7 дней
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="rounded-full px-8 py-6 text-lg font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Вход в систему
            </Button>
          </motion.div>
        </LampContainer>
      </section>

      {/* Block 2: Brand Story */}
      <section id="brand" className="py-24 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                Почему я назвал проект{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  в честь сына?
                </span>
              </h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Проект MarkVision назван в честь моего сына Марка. Для меня это не просто бизнес, это наследие.
                </p>
                <p>
                  Я лично отвечаю за результат каждой клиники, которая работает с нами. Я строю эту систему так, чтобы за неё не было стыдно перед сыном.
                </p>
                <p className="text-xl font-semibold text-slate-900 border-l-4 border-cyan-500 pl-4">
                  Мы не просто настраиваем рекламу — мы наводим порядок в вашем бизнесе.
                </p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/50">
                  <div className="text-center p-8">
                    <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/30">
                      <span className="text-7xl">👨‍👦</span>
                    </div>
                    <p className="text-slate-600 font-medium text-lg">Основатель с сыном Марком</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Block 3: Animated Beam Integration */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Единый мозг{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                вашего маркетинга и продаж
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Все ваши каналы привлечения объединены в одну умную систему
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/50 bg-white"
          >
            <BeamVisualization />
          </motion.div>
        </div>
      </section>

      {/* Block 4: 6 Modules Grid */}
      <section id="modules" className="py-24 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              6 модулей{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                системы MarkVision
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Полный набор инструментов для масштабирования вашей клиники
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <BackgroundGradientLight containerClassName="h-full">
                  <div className="p-8 h-full bg-white rounded-3xl">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-3xl shadow-sm border border-slate-100">
                        {module.icon}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">{module.number}</span>
                        <h3 className="text-xl font-bold text-slate-900 mt-2">{module.title}</h3>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </BackgroundGradientLight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 5: Registration Form */}
      <section id="signup" ref={signupRef} className="py-24 md:py-32 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Начните бесплатно
              </h2>
              <p className="text-slate-600">
                7 дней полного доступа ко всем функциям системы
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Clinic Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Название клиники</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder='Клиника "Здоровье"'
                      value={formData.clinicName}
                      onChange={(e) => handleChange('clinicName', e.target.value)}
                      className={`pl-12 rounded-2xl h-14 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 ${errors.clinicName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.clinicName && <p className="text-xs text-red-500">{errors.clinicName}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`pl-12 rounded-2xl h-14 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={`pl-12 pr-12 rounded-2xl h-14 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Промокод</label>
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="MARK7"
                      value={formData.promoCode}
                      onChange={(e) => handleChange('promoCode', e.target.value.toUpperCase())}
                      className={`pl-12 rounded-2xl h-14 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 ${promoValid === true ? 'border-green-500 bg-green-50' : ''}`}
                    />
                    {promoValid === true && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {promoValid === true && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-green-600 font-medium flex items-center gap-2"
                    >
                      <span>🎉</span> Активирован бесплатный доступ на 7 дней
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-lg mt-2"
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
              <div className="mt-6 text-center">
                <span className="text-slate-500">Уже есть аккаунт? </span>
                <button
                  onClick={() => navigate('/auth')}
                  className="text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Войти
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-semibold text-lg">MarkVision AI</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 MarkVision AI. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
