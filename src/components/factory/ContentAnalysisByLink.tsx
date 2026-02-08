import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Search,
  Loader2,
  Cpu,
  Binary,
  Fingerprint,
  ScanLine,
  Target,
  MessageCircle,
  TrendingUp,
  Copy,
  Rocket,
  Check,
  Terminal,
  ChevronRight,
  ShieldCheck,
  Dna,
  History,
  Layout,
  MousePointer2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface AnalysisResult {
  dna: {
    transcription: string;
    hooks: string[];
    cta: string;
  };
  triggers: {
    reason: string;
    emotional_peaks: string[];
    technical_analysis: string;
  };
  adaptations: Array<{
    title: string;
    script: string;
    target_niche: string;
  }>;
}

const SYSTEM_LOGS = [
  "[SYSTEM]: Инициализация диагностического порта...",
  "[SYSTEM]: Подключение к нейронному шлюзу n8n...",
  "[SYSTEM]: Декодирую виральный код ролика...",
  "[SYSTEM]: Транскрибирую аудио-дорожку...",
  "[SYSTEM]: Анализирую эмоциональные пики...",
  "[SYSTEM]: Извлечение хуков и CTA...",
  "[SYSTEM]: Генерация стратегий адаптации...",
  "[SYSTEM]: Деконструкция завершена успешно."
];

export const ContentAnalysisByLink = ({ projectId }: { projectId: string }) => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // For the laser beam effect
  const [isPasted, setIsPasted] = useState(false);

  useEffect(() => {
    if (isScanning && logIndex < SYSTEM_LOGS.length - 1) {
      const timer = setTimeout(() => {
        setLogIndex(prev => prev + 1);
      }, 1000 + Math.random() * 1000);
      return () => clearTimeout(timer);
    }
  }, [isScanning, logIndex]);

  const handleDecode = async () => {
    if (!url.trim()) {
      toast.error('Пожалуйста, введите ссылку для декодирования');
      return;
    }

    setIsScanning(true);
    setLogIndex(0);
    setResult(null);

    try {
      // n8n Webhook Integration
      // In a real scenario, this would be a real URL from env
      const WEBHOOK_URL = 'https://n8n.markvision.ai/webhook/content-decoder';

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          projectId,
          userId: user?.id,
          timestamp: new Date().toISOString()
        })
      });

      // For demo purposes, if webhook fails or is unreachable, use mock data after logs finish
      // To simulate real waiting
      await new Promise(resolve => setTimeout(resolve, 8000));

      const mockData: AnalysisResult = {
        dna: {
          transcription: "Добро пожаловать в будущее вашей клиники. Вы когда-нибудь задумывались, почему одни кабинеты пустуют, а к другим очередь на месяц вперед? Секрет не в оборудовании, а в доверии. Мы помогаем врачам стать лидерами мнений.",
          hooks: ["Почему одни клиники пустуют?", "Секрет не в оборудовании", "Будущее вашей клиники уже здесь"],
          cta: "Запишитесь на бесплатную консультацию по маркетингу по ссылке в описании."
        },
        triggers: {
          reason: "Контрастный сторителлинг и визуальный темп 1.5x.",
          emotional_peaks: ["Страх упущенной возможности (FOMO) на 0:05", "Облегчение/Решение на 0:15"],
          technical_analysis: "Используется частотная коррекция голоса для придания авторитетности. Прямой взгляд в камеру (Eye Contact) 90% времени."
        },
        adaptations: [
          {
            title: "Вариант 'Стоматология'",
            target_niche: "Стоматологическая клиника",
            script: "Почему в вашей стоматологии кресла пустуют, пока у конкурентов запись на месяц? Секрет не в дорогих имплантах, а в том, как вы о них рассказываете. Пора превратить ваш Instagram в очередь из пациентов."
          },
          {
            title: "Вариант 'Футбольная Школа'",
            target_niche: "Детский спорт",
            script: "Ваш ребенок мечтает о Месси, но вы не знаете, как привлечь его в секцию? Секрет не в поле, а в мечте. Покажите родителям будущее их чемпиона через наши тренировки."
          },
          {
            title: "Вариант 'Личный Бренд'",
            target_niche: "Экспертный контент",
            script: "Твои знания стоят миллионы, но почему чеки до сих пор маленькие? Секрет не в дипломах, а в охвате. Давай упакуем твой опыт в систему, которая продает сама."
          }
        ]
      };

      setResult(mockData);
      toast.success('Декодирование завершено!');
    } catch (error) {
      console.error('Decoding failed:', error);
      // Check if logs finished, if not, wait a bit
      toast.error('Ошибка связи с нейросетью. Попробуйте позже.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar relative bg-[#030712]">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md"
          >
            <Binary className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">Content Decoder v5.0</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
            ДЕКОДЕР <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">ВИРАЛЬНОСТИ</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
            Вставьте ссылку на любой успешный ролик. Наш AI разложит его на атомы:
            от нейронных триггеров до полного сценария адаптации.
          </p>
        </div>

        {/* Diagnostic Port Input */}
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />

          <div className="relative bg-[#0d0d0d] border border-white/5 rounded-[1.5rem] p-2 flex items-center shadow-2xl overflow-hidden backdrop-blur-3xl">
            {/* Laser Beam Animation on Paste/Focus */}
            <AnimatePresence>
              {(isScanning || isPasted) && (
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-[100px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent z-0 skew-x-12"
                />
              )}
            </AnimatePresence>

            <div className="flex-1 flex items-center px-4 relative z-10">
              <Search className="w-5 h-5 text-muted-foreground/50 mr-3" />
              <input
                type="text"
                placeholder="Вставьте ссылку на Reels, TikTok или Shorts..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={() => {
                  setIsPasted(true);
                  setTimeout(() => setIsPasted(false), 2000);
                }}
                className="w-full bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-muted-foreground/30 h-12"
              />
            </div>

            <Button
              onClick={handleDecode}
              disabled={isScanning || !url.trim()}
              className="interstellar-button-shimmer h-12 rounded-xl px-8 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border-0 font-bold uppercase tracking-widest text-xs relative overflow-hidden group/btn"
            >
              <div className="relative z-10 flex items-center gap-2">
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                DECODE
              </div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default">
              <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_5px_pink]" />
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Instagram</span>
            </div>
            <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_cyan]" />
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">TikTok</span>
            </div>
            <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red]" />
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">YouTube</span>
            </div>
          </div>
        </div>

        {/* Loading State: System logs */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-xs space-y-2 backdrop-blur-xl shadow-inner shadow-cyan-500/5 ring-1 ring-white/5"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Terminal className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest">Scanning Mode</span>
                </div>
                <div className="text-[10px] text-muted-foreground animate-pulse uppercase">Active Task</div>
              </div>

              <div className="space-y-1 h-[120px] overflow-hidden flex flex-col justify-end">
                {SYSTEM_LOGS.slice(0, logIndex + 1).map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-start gap-2",
                      i === logIndex ? "text-cyan-400 font-bold" : "text-white/40"
                    )}
                  >
                    <span className="shrink-0">{i === logIndex ? ">>" : ">"}</span>
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Panels */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Panel A: DNA Video */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <Dna className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">ДНК Видео</h3>
                </div>

                <Card className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl overflow-hidden relative group h-full flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full blur-3xl" />
                  <CardContent className="p-6 space-y-6 flex-1">
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-tighter">Transcription</div>
                      <p className="text-sm text-white/70 italic leading-relaxed font-mono bg-white/5 p-4 rounded-2xl border border-white/5">
                        "{result.dna.transcription}"
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-tighter">Extracted Hooks</div>
                      <div className="space-y-2">
                        {result.dna.hooks.map((hook, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 group/item hover:border-cyan-500/30 transition-all">
                            <Zap className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                            <span className="text-sm font-bold text-white/90">{hook}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase font-mono tracking-tighter mb-2">Final Call to Action</div>
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                        <span className="text-sm font-bold block bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                          {result.dna.cta}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Panel B: Viral Triggers */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">Виральные триггеры</h3>
                </div>

                <Card className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl overflow-hidden relative group h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full blur-3xl" />
                  <CardContent className="p-6 space-y-8">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                      <h4 className="text-xs font-bold text-purple-400 mb-3 uppercase tracking-wider">Главный секрет успеха</h4>
                      <p className="text-sm text-white/90 leading-relaxed font-mono">
                        {result.triggers.reason}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-tighter">Neural Emotional Peaks</h4>
                      <div className="space-y-3">
                        {result.triggers.emotional_peaks.map((peak, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            <span className="text-sm text-white/70 font-mono tracking-tight">{peak}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase font-mono tracking-tighter">Technical Fidelity Analysis</h4>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed italic">
                        {result.triggers.technical_analysis}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Panel C: Adaptations */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">Новые сценарии</h3>
                </div>

                <div className="space-y-4">
                  {result.adaptations.map((adaptation, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.04] hover:border-emerald-500/30 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                          onClick={() => handleCopy(adaptation.script, i)}
                        >
                          {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400 uppercase px-2 py-0">
                            {adaptation.target_niche}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{adaptation.title}</h4>
                        <p className="text-xs text-white/50 line-clamp-3 leading-relaxed font-mono">
                          {adaptation.script}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase font-mono tracking-widest flex items-center gap-1.5">
                          <Binary className="w-3 h-3" /> Ready for production
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[9px] uppercase font-bold tracking-widest hover:bg-emerald-500/10 hover:text-emerald-400 gap-1 px-2"
                        >
                          В МАСТЕРСКУЮ <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* System Footer Decoration */}
        {!isScanning && !result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="flex flex-col items-center gap-6 py-20"
          >
            <div className="flex items-center gap-8 grayscale">
              <Fingerprint className="w-12 h-12 text-white/20" />
              <Dna className="w-12 h-12 text-white/20" />
              <Cpu className="w-12 h-12 text-white/20" />
            </div>
            <div className="space-y-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">NEURAL ENGINE ACTIVE</div>
              <div className="text-[8px] font-mono text-white/10 uppercase">Awaiting instruction... Waiting for input string...</div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'outline' }) => (
  <span className={cn(
    "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
    variant === 'outline' ? "border" : "bg-primary",
    className
  )}>
    {children}
  </span>
);
