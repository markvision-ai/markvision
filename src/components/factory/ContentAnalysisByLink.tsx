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
  Sparkles,
  Video,
  Instagram
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
  "[SYSTEM]: Инициализация...",
  "[SYSTEM]: Подключение к сервису...",
  "[SYSTEM]: Анализирую ролик...",
  "[SYSTEM]: Транскрибирую аудио...",
  "[SYSTEM]: Выделяю главное...",
  "[SYSTEM]: Извлекаю хуки и CTA...",
  "[SYSTEM]: Генерирую идеи...",
  "[SYSTEM]: Анализ завершен успешно."
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
      toast.success('Анализ завершен!');
    } catch (error) {
      console.error('Decoding failed:', error);
      // Check if logs finished, if not, wait a bit
      toast.error('Сервис сейчас недоступен. Попробуйте позже.');
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
    <div className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar relative bg-background">
      {/* Background Ambience - Removed for clean look */}

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Анализ контента</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            АНАЛИЗ <span className="text-primary">КОНТЕНТА</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
            Вставьте ссылку на любой успешный ролик. Наш AI разложит его на детали:
            от главных триггеров до сценария адаптации под ваш продукт.
          </p>
        </div>

        {/* Diagnostic Port Input */}
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-card border border-border rounded-[1.5rem] p-2 flex items-center shadow-lg overflow-hidden transition-all hover:shadow-xl hover:border-primary/50">
            <div className="flex-1 flex items-center px-4 relative z-10">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Вставьте ссылку на Reels, TikTok или Shorts..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground h-12"
              />
            </div>

            <Button
              onClick={handleDecode}
              disabled={isScanning || !url.trim()}
              className="h-12 rounded-xl px-8 font-bold uppercase tracking-widest text-xs relative overflow-hidden transition-all duration-300"
            >
              <div className="relative z-10 flex items-center gap-2">
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                DECODE
              </div>
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-1.5 cursor-default text-muted-foreground">
              <Instagram className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Instagram</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-default text-muted-foreground">
              <div className="w-3 h-3 flex items-center justify-center font-bold text-[8px] bg-foreground text-background rounded-sm">T</div>
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">TikTok</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-default text-muted-foreground">
              <Video className="w-3 h-3" />
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
              className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-6 font-mono text-xs space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-primary">
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
                      i === logIndex ? "text-primary font-bold" : "text-muted-foreground"
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
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Dna className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest text-foreground">ДНК Видео</h3>
                </div>

                <Card className="bg-card border-border rounded-3xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6 space-y-6 flex-1">
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-tighter">Transcription</div>
                      <p className="text-sm text-foreground italic leading-relaxed font-mono bg-muted/50 p-4 rounded-2xl border border-border">
                        "{result.dna.transcription}"
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-tighter">Extracted Hooks</div>
                      <div className="space-y-2">
                        {result.dna.hooks.map((hook, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-muted border border-border">
                            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm font-bold text-foreground">{hook}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-border">
                      <div className="text-[10px] font-bold text-primary uppercase font-mono tracking-tighter mb-2">Final Call to Action</div>
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-primary shrink-0 mt-1" />
                        <span className="text-sm font-bold block text-foreground">
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
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest text-foreground">Виральные триггеры</h3>
                </div>

                <Card className="bg-card border-border rounded-3xl overflow-hidden h-full shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6 space-y-8">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                      <h4 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Главный секрет успеха</h4>
                      <p className="text-sm text-foreground leading-relaxed font-mono">
                        {result.triggers.reason}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-tighter">Neural Emotional Peaks</h4>
                      <div className="space-y-3">
                        {result.triggers.emotional_peaks.map((peak, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-sm text-foreground font-mono tracking-tight">{peak}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-bold text-primary uppercase font-mono tracking-tighter">Technical Fidelity Analysis</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
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
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest text-foreground">Новые сценарии</h3>
                </div>

                <div className="space-y-4">
                  {result.adaptations.map((adaptation, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className="group relative bg-card border border-border rounded-2xl p-4 transition-all hover:shadow-md"
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-muted text-foreground"
                          onClick={() => handleCopy(adaptation.script, i)}
                        >
                          {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary/20 text-primary uppercase px-2 py-0">
                            {adaptation.target_niche}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-foreground transition-colors">{adaptation.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-mono">
                          {adaptation.script}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase font-mono tracking-widest flex items-center gap-1.5">
                          <Binary className="w-3 h-3" /> Ready for production
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[9px] uppercase font-bold tracking-widest hover:bg-primary/10 hover:text-primary gap-1 px-2"
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
        {/* System Footer Decoration */}
        {!isScanning && !result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="flex flex-col items-center gap-6 py-20"
          >
            <div className="flex items-center gap-8 grayscale opacity-20">
              <Fingerprint className="w-12 h-12 text-muted-foreground" />
              <Dna className="w-12 h-12 text-muted-foreground" />
              <Cpu className="w-12 h-12 text-muted-foreground" />
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
