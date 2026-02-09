import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Rocket, Brain, Target, BarChart3, Factory, Eye, Sparkles,
  TrendingUp, Users, GraduationCap, Stethoscope, Shield,
  Zap, Layers, ArrowRight, ChevronDown, Globe, Cpu,
  DollarSign, PieChart, Activity, Workflow, Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ──────────────────────────────────────────────
   Animated section wrapper — fades in on scroll
   ────────────────────────────────────────────── */
const Section = ({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </motion.section>
  );
};

/* ──────────────────────────────────────────────
   Glowing stat card for metrics
   ────────────────────────────────────────────── */
const StatCard = ({
  value,
  label,
  delay = 0,
}: {
  value: string;
  label: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 text-center">
        <p className="font-mono text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {value}
        </p>
        <p className="mt-2 text-sm text-gray-400">{label}</p>
      </div>
    </motion.div>
  );
};

/* ──────────────────────────────────────────────
   Module card for the feature showcase
   ────────────────────────────────────────────── */
const ModuleCard = ({
  icon: Icon,
  title,
  subtitle,
  features,
  gradient,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  features: string[];
  gradient: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative group h-full"
    >
      {/* Hover glow */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-700`}
      />

      <div className="relative h-full rounded-2xl border border-white/[0.08] bg-[#0a0d14]/80 backdrop-blur-2xl p-6 sm:p-8 flex flex-col">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-400 mb-5">{subtitle}</p>

        {/* Features */}
        <ul className="space-y-3 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
              <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

/* ──────────────────────────────────────────────
   Audience card
   ────────────────────────────────────────────── */
const AudienceCard = ({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg hover:border-cyan-500/30 transition-colors duration-300"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════
   MAIN PRESENTATION PAGE
   ════════════════════════════════════════════════ */
export default function Presentation() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#05070A] text-white overflow-x-hidden selection:bg-cyan-500/30"
    >
      {/* ── Progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 z-50"
        style={{ width: progressWidth }}
      />

      {/* ── Ambient background effects ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* ── Floating nav ── */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/[0.08] bg-[#05070A]/80 backdrop-blur-2xl shadow-2xl"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">MV</span>
        </div>
        <span className="text-sm font-semibold text-white tracking-wide hidden sm:inline">
          MarkVision AI
        </span>
        <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
        <span className="text-xs text-gray-400 hidden sm:inline">Pitch Deck</span>
      </motion.nav>

      <div className="relative z-10 space-y-0">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 1 — HERO / INTRO
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
          {/* Hero glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/[0.08] rounded-full blur-[120px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-medium text-cyan-400 tracking-wide uppercase">
                Investor Pitch Deck 2025
              </span>
            </motion.div>

            {/* Title */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95]">
              <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                MarkVision
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              ИИ-Операционная Система для управления бизнесом.
              <br />
              <span className="text-gray-500">
                Маркетинг. Аналитика. Контент. Стратегия.
              </span>
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={() => navigate("/signup")}
                className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm tracking-wide shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Начать бесплатно <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <a
                href="#problem"
                className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm hover:border-white/20 hover:text-white transition-all duration-300"
              >
                Смотреть презентацию
              </a>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-6 h-6 text-gray-600" />
            </motion.div>
          </motion.div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 2 — FOUNDER & STORY
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section className="py-32" id="founder">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/[0.06] mb-6">
                <Star className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium uppercase tracking-wide">
                  Личный бренд
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Основатель —{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Юрий Валерьевич
                </span>
              </h2>

              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Платформа названа в честь сына —{" "}
                  <span className="text-white font-semibold">Марка</span>.
                  Это не просто продукт. Это наследие.
                </p>
                <p>
                  <span className="text-cyan-400 font-semibold">Mark</span> — имя, которое несет силу.{" "}
                  <span className="text-purple-400 font-semibold">Vision</span> — способность видеть
                  будущее бизнеса раньше, чем оно наступит.
                </p>
                <p>
                  Миссия: создать инструмент, который превращает хаос в систему,
                  данные — в стратегию, а интуицию — в алгоритм.
                </p>
              </div>
            </div>

            {/* Right — visual */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl blur-3xl" />
              <div className="relative w-full max-w-md aspect-square rounded-3xl border border-white/[0.06] bg-[#0a0d14]/60 backdrop-blur-2xl flex flex-col items-center justify-center p-10">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                  <span className="text-4xl font-extrabold text-white">MV</span>
                </div>
                <p className="text-2xl font-bold text-white mb-2">MarkVision AI</p>
                <p className="text-sm text-gray-500 text-center">
                  "Видеть будущее бизнеса — это не дар.
                  <br />
                  Это технология."
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/50" />
                  <span className="text-xs text-gray-600 font-mono">EST. 2024</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500/50" />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 3 — PROBLEM
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section className="py-32" id="problem">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/[0.06] mb-6">
              <Target className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-400 font-medium uppercase tracking-wide">
                Проблема
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Маркетинг сегодня —{" "}
              <span className="text-red-400">хаос</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Бизнес теряет миллионы из-за неэффективных процессов, слепой аналитики и человеческого фактора
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: DollarSign,
                title: "Слив бюджетов",
                desc: "До 60% рекламного бюджета уходит на неэффективные каналы без аналитики",
                stat: "60%",
              },
              {
                icon: PieChart,
                title: "Слепая аналитика",
                desc: "Данные разбросаны по 10+ платформам. Никто не видит полную картину",
                stat: "10+",
              },
              {
                icon: Users,
                title: "Зависимость от людей",
                desc: "Уход маркетолога = потеря стратегии. Весь опыт — в голове одного человека",
                stat: "1",
              },
              {
                icon: Activity,
                title: "Ручной контент",
                desc: "Создание одного поста занимает часы. Нужен дизайнер, копирайтер, SMM",
                stat: "3+",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-b from-red-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />
                <div className="relative rounded-2xl border border-white/[0.06] bg-[#0a0d14]/80 backdrop-blur-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <item.icon className="w-5 h-5 text-red-400" />
                    <span className="font-mono text-2xl font-bold text-red-400/60">
                      {item.stat}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 4 — SOLUTION
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section className="py-32" id="solution">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] mb-6">
              <Rocket className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium uppercase tracking-wide">
                Решение
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Наш{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                "Космолёт"
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Единая экосистема, где ИИ усиливает отдел аналитики, контента и стратегии.
              Всё в одном интерфейсе — 24/7.
            </p>
          </div>

          {/* Architecture visual */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-purple-500/5 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl border border-white/[0.06] bg-[#0a0d14]/60 backdrop-blur-2xl p-8 sm:p-12">
              <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
                {[
                  { icon: BarChart3, label: "Аналитика", color: "from-cyan-500 to-blue-500" },
                  { icon: Factory, label: "Контент", color: "from-purple-500 to-pink-500" },
                  { icon: Brain, label: "Стратегия", color: "from-emerald-500 to-teal-500" },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{item.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Connecting lines */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-2">
                  ИИ-ядро{" "}
                  <span className="font-mono text-cyan-400">Mark</span>
                </p>
                <p className="text-sm text-gray-500">
                  Проактивный мозг системы. Анализирует, советует, автоматизирует.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 5 — MODULES
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section className="py-32" id="modules">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] mb-6">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium uppercase tracking-wide">
                Модули платформы
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Четыре{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                двигателя
              </span>{" "}
              роста
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Каждый модуль — самостоятельная система. Вместе — непобедимая экосистема.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ModuleCard
              icon={TrendingUp}
              title="Финансовый Терминал"
              subtitle="Декомпозиция целей и юнит-экономика"
              gradient="from-emerald-500 to-teal-500"
              delay={0}
              features={[
                "От цели в тенге — до каждого клика. Полная декомпозиция воронки.",
                "Юнит-экономика в реальном времени: LTV, CAC, ROMI, ROI на каждый канал.",
                "Модель CPL по сценариям: лучший, средний, худший — с автопересчётом бюджета.",
                "Синхронизация расходов с Meta/Facebook Ads автоматически.",
                "Прогнозирование доходности канала до запуска рекламы.",
              ]}
            />

            <ModuleCard
              icon={Factory}
              title="Центр Контента"
              subtitle="Универсальный конвейер: 1 идея → 10 публикаций"
              gradient="from-purple-500 to-pink-500"
              delay={0.15}
              features={[
                "Полный цикл: идея → скрипт → озвучка → аватар → монтаж → публикация.",
                "ИИ-генерация идей на основе трендов и конкурентного анализа.",
                "AI-аватары и голоса для видеоконтента без оператора.",
                "Мультиплатформенная публикация: Instagram, TikTok, Telegram, Threads.",
                "Kanban-доска с производственным пайплайном контента.",
              ]}
            />

            <ModuleCard
              icon={Eye}
              title="Мониторинг Конкурентов"
              subtitle="AI-шпионаж и деконструкция виральности"
              gradient="from-orange-500 to-red-500"
              delay={0.3}
              features={[
                "24/7 сканирование аккаунтов конкурентов на всех платформах.",
                "Оценка виральности каждого поста по шкале 0–100%.",
                "Автоматическая адаптация вирального контента под ваш бренд.",
                "Единая лента всех конкурентов с фильтрами по метрикам.",
                "Трансфер адаптированных идей прямо в Центр Контента одним кликом.",
              ]}
            />

            <ModuleCard
              icon={Brain}
              title="AI Analyst — Марк"
              subtitle="Проактивный мозг системы"
              gradient="from-cyan-500 to-blue-500"
              delay={0.45}
              features={[
                "Анализ воронки продаж, прогнозы, оптимизация бюджета — в чате.",
                "Доступ к реальным данным Meta Ads, CRM, финансов в реальном времени.",
                "Автоматические рекомендации: масштабировать / приостановить / перераспределить.",
                "Стриминговые ответы на базе Claude 3.5 Sonnet с контекстом вашего бизнеса.",
                "Запуск автоматизаций (n8n) голосовыми командами через чат.",
              ]}
            />
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 6 — METRICS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section className="py-32" id="metrics">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Цифры, которые{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                говорят сами
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard value="6" label="Модулей в экосистеме" delay={0} />
            <StatCard value="200+" label="Единиц контента / мес" delay={0.1} />
            <StatCard value="24/7" label="ИИ-аналитик на связи" delay={0.2} />
            <StatCard value="10x" label="Ускорение контент-пайплайна" delay={0.3} />
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 7 — TARGET AUDIENCE
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section className="py-32" id="audience">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] mb-6">
                <Users className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium uppercase tracking-wide">
                  Для кого
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Кому это{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  нужно
                </span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                MarkVision AI создан для тех, кто устал от хаоса и хочет управлять маркетингом как системой — с цифрами, автоматизацией и ИИ.
              </p>
            </div>

            <div className="space-y-4">
              <AudienceCard
                icon={Globe}
                title="Маркетинговые агентства"
                description="Управление десятками клиентов из одного интерфейса. Автоматизация отчётов, контента и аналитики. Масштабирование без найма."
                delay={0}
              />
              <AudienceCard
                icon={Stethoscope}
                title="Владельцы клиник"
                description="На примере стоматологии Уали: от заявки до визита. Полная аналитика пациентопотока, ROI рекламы и автоматическая запись 24/7."
                delay={0.15}
              />
              <AudienceCard
                icon={GraduationCap}
                title="Образовательные проекты"
                description="Генерация образовательного контента, автоворонки для курсов, аналитика конверсий от лида до ученика."
                delay={0.3}
              />
            </div>
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 8 — TECH / ASTANA HUB
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section className="py-32" id="tech">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] mb-6">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium uppercase tracking-wide">
                Astana Hub Ready
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Технологический{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                стек
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Построено на передовых технологиях. Готово к масштабированию.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Supabase", desc: "Backend & Auth", icon: Cpu },
              { name: "n8n", desc: "Автоматизация", icon: Workflow },
              { name: "Claude 3.5", desc: "LLM-ядро", icon: Brain },
              { name: "Gemini 3", desc: "Мультимодальный ИИ", icon: Sparkles },
              { name: "React 18", desc: "Frontend", icon: Layers },
              { name: "Agentic IDE", desc: "AI-разработка", icon: Zap },
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative group cursor-default"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />
                <div className="relative rounded-xl border border-white/[0.06] bg-[#0a0d14]/80 backdrop-blur-xl p-4 text-center h-full">
                  <tech.icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white font-mono">{tech.name}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{tech.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Extra note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03]">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-400">
                Резидент{" "}
                <span className="text-emerald-400 font-semibold">Astana Hub</span>{" "}
                — IT-парк Казахстана. Налоговые льготы. Международная экспертиза.
              </span>
            </div>
          </motion.div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SLIDE 9 — CLOSING CTA
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative py-32 sm:py-40">
          {/* Big glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[700px] h-[700px] bg-gradient-to-br from-cyan-500/[0.08] to-purple-500/[0.08] rounded-full blur-[150px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center max-w-3xl mx-auto px-4"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Будущее бизнеса —{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                за теми, кто видит
              </span>
            </h2>

            <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              MarkVision AI — ваш ИИ-штаб, который работает 24/7.
              Пока вы управляете бизнесом, мы управляем маркетингом.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(6,182,212,0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/signup")}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base tracking-wide shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300"
              >
                Начать сейчас
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                className="px-10 py-4 rounded-xl border border-white/10 text-gray-300 font-semibold text-base hover:border-white/20 hover:text-white transition-all duration-300"
              >
                На главную
              </motion.button>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-white/[0.06]">
              <p className="text-xs text-gray-600">
                &copy; {new Date().getFullYear()} MarkVision AI. Все права защищены.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
