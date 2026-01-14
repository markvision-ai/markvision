"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LampContainer, LampContainerMini } from "@/components/ui/lamp";
import { BackgroundGradient, BackgroundGradientLight } from "@/components/ui/background-gradient";
import { MagneticCard } from "@/components/ui/magnetic-card";
import { BeamVisualization } from "./BeamVisualization";
import { 
  ArrowRight, 
  Sparkles, 
  Play, 
  Shield,
  Menu,
  X
} from "lucide-react";

const modules = [
  {
    number: "01",
    title: "Контент-Завод",
    description: "200+ публикаций в месяц. ИИ берет на себя всю работу: от поиска идей до монтажа. Мы создаем такой объем контента в Instagram, YouTube и TikTok, который невозможно повторить вручную.",
    icon: "🎬",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    number: "02",
    title: "Воронка 24/7",
    description: "Автоматическая запись. Каждый просмотр и каждый комментарий ведут пациента в воронку. Система сама консультирует лида, обрабатывает возражения и записывает на приём.",
    icon: "🤖",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    number: "03",
    title: "Сквозная аналитика",
    description: "От показов до кассы. Вы видите четкую связь: что принесло запись и сколько прибыли пришло в клинику. Весь путь пациента оцифрован в одном окне.",
    icon: "📊",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    number: "04",
    title: "Умная CRM и Финансы (PnL)",
    description: "Полный учет пациентов и денег. Автоматический расчет чистой прибыли, окупаемости рекламы и контроль каждой оплаты. Ваш бизнес в телефоне 24/7.",
    icon: "💰",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    number: "05",
    title: "ИИ-РОП (Контроль работы)",
    description: "Автоматический надзор за персоналом. ИИ анализирует все переписки и звонки, ставит задачи сотрудникам и следит за выполнением плана продаж.",
    icon: "👁️",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    number: "06",
    title: "Автоматические отчеты",
    description: "Глубокая аналитика за 1 секунду. Получайте ежедневные и еженедельные отчеты о работе клиники, эффективности врачей и прогнозе выручки на основе ИИ-данных.",
    icon: "📈",
    gradient: "from-blue-500 to-indigo-500",
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [videoWatched, setVideoWatched] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const openChatBot = () => {
    // Placeholder for chatbot integration
    window.open("https://wa.me/message/YOUR_WHATSAPP_LINK", "_blank");
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Sticky Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl text-slate-900 hidden sm:block">MarkVision AI</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection("brand")}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              О проекте
            </button>
            <button 
              onClick={() => scrollToSection("modules")}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Как это работает
            </button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
              className="text-slate-600 hover:text-slate-900"
            >
              Вход
            </Button>
            <Button 
              onClick={() => navigate("/signup")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full px-6 shadow-lg shadow-cyan-500/20"
            >
              Начать бесплатно
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
              Как это работает
            </button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Вход
            </Button>
            <Button 
              onClick={() => navigate("/signup")}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              Начать бесплатно
            </Button>
          </motion.div>
        )}
      </header>

      {/* Block 1: Hero with Lamp Effect */}
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
            Увеличьте количество визитов в клинику на 30% и получайте от 500 000 ₸ выручки в день дополнительно, без увеличения рекламного бюджета.
          </motion.p>
          
          {/* VSL Video Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-10 w-full max-w-3xl px-4"
          >
            <BackgroundGradient containerClassName="w-full">
              <div className="bg-slate-900 rounded-[22px] p-1">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={() => setVideoWatched(true)}
                      className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 group"
                    >
                      <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white/60 text-sm">
                      Посмотрите видео до конца, чтобы получить бонус
                    </p>
                  </div>
                </div>
              </div>
            </BackgroundGradient>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-8"
          >
            <Button
              size="lg"
              onClick={() => scrollToSection("offer")}
              disabled={!videoWatched}
              className={`rounded-full px-8 py-6 text-lg font-semibold shadow-xl transition-all ${
                videoWatched
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/30 hover:scale-105"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Записаться на диагностику
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!videoWatched && (
              <p className="text-slate-500 text-sm mt-3">
                Посмотрите видео, чтобы разблокировать кнопку
              </p>
            )}
          </motion.div>
        </LampContainer>
      </section>

      {/* Block 2: Brand Story */}
      <section id="brand" className="py-20 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
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
                <p className="text-xl font-semibold text-slate-800">
                  Мы не просто настраиваем рекламу — мы наводим порядок в вашем бизнесе.
                </p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <BackgroundGradientLight containerClassName="max-w-md mx-auto lg:ml-auto">
                <div className="p-8">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                        <span className="text-6xl">👨‍👦</span>
                      </div>
                      <p className="text-slate-600 font-medium">Основатель с сыном Марком</p>
                    </div>
                  </div>
                </div>
              </BackgroundGradientLight>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Block 3: Animated Beam Integration */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Автоматизация, которая{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                работает на вас
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
          >
            <BackgroundGradientLight containerClassName="w-full">
              <BeamVisualization className="border border-slate-100" />
            </BackgroundGradientLight>
          </motion.div>
        </div>
      </section>

      {/* Block 4: Modules Grid */}
      <section id="modules" className="py-20 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              6 инструментов для{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                доминирования на рынке
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
                <MagneticCard containerClassName="h-full">
                  <BackgroundGradientLight containerClassName="h-full">
                    <div className="p-6 md:p-8 h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                          {module.icon}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-400">{module.number}</span>
                          <h3 className="text-lg font-bold text-slate-900">{module.title}</h3>
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </BackgroundGradientLight>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 5: Guarantee */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <BackgroundGradient containerClassName="w-full">
              <div className="bg-slate-900 rounded-[22px] p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-8 shadow-lg shadow-cyan-500/30">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  100% гарантия результата.
                </h2>
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                  Я беру на себя ответственность за каждое действие. Если система не принесет вам обещанный результат в оговоренные сроки — я работаю бесплатно, пока не выполним план. Весь риск лежит на мне, а не на вашей клинике.
                </p>
              </div>
            </BackgroundGradient>
          </motion.div>
        </div>
      </section>

      {/* Block 6: Offer CTA */}
      <section id="offer" className="py-8 md:py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <LampContainerMini>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Стратегический разбор: план на{" "}
                <span className="text-cyan-400">+500 000 ₸</span>{" "}
                выручки в день
              </h2>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Разберем вашу текущую ситуацию и дадим пошаговый план на 2026 год. Вы узнаете, как увеличить доход клиники, без увеличения расходов.
              </p>
              <div className="mb-8">
                <span className="text-4xl md:text-5xl font-bold text-white">9 900 ₸</span>
                <span className="text-slate-400 ml-2 line-through">29 900 ₸</span>
              </div>
              <Button
                size="lg"
                onClick={openChatBot}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full px-12 py-7 text-lg font-semibold shadow-xl shadow-cyan-500/30 hover:scale-105 transition-transform"
              >
                Записаться на разбор
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </LampContainerMini>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-bold text-xl text-white">MarkVision AI</span>
          </div>
          <p className="text-slate-400">
            © 2025 MarkVision AI. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
