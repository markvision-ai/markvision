import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  Search,
  Loader2,
  FileText,
  CheckCircle,
  ArrowRight,
  Link as LinkIcon,
  PlayCircle,
  MessageCircle,
  TrendingUp,
  Target,
  ScanLine,
  Binary,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';
import { useContentFactory } from '@/hooks/useContentFactory';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ContentAnalysisByLinkProps {
  projectId: string;
}

interface AnalysisResult {
  topic: string;
  hook: string;
  script_structure: string[];
  cta: string;
  virality_factors: string[];
  summary: string;
}

export const ContentAnalysisByLink = ({ projectId }: ContentAnalysisByLinkProps) => {
  const { createContent } = useContentFactory(projectId);
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Пожалуйста, введите ссылку');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-content-link', {
        body: { url }
      });

      if (error) {
        throw new Error(error.message || 'Ошибка при вызове функции анализа');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success('Анализ завершен!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Не удалось проанализировать ссылку. Возможно, превышен лимит или сервиc недоступен.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateScenario = async () => {
    if (!result) return;

    setIsCreating(true);
    try {
      const success = await createContent({
        title: `Ремейк: ${result.topic}`,
        description: `
Создать сценарий на основе анализа успешного ролика.

ИСХОДНЫЕ ДАННЫЕ:
Ссылка: ${url}
Тема: ${result.topic}

СТРУКТУРА:
Хук: ${result.hook}
CTA: ${result.cta}

ПОЧЕМУ ЗАШЛО (УЧЕСТЬ В СЦЕНАРИИ):
${result.virality_factors.map(f => `- ${f}`).join('\n')}

РЕЗЮМЕ:
${result.summary}
        `,
        platform_type: 'avatar_video', // Default to avatar video
        status: 'pending' // Send to incoming stream
      });

      if (success) {
        toast.success('Сценарий отправлен в производство');
        setUrl('');
        setResult(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при создании сценария');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-10 overflow-y-auto bg-transparent font-sans">
      {/* Header with animated deep scan effect */}
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full text-center items-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-medium uppercase tracking-wider mb-2 backdrop-blur-md">
          <ScanLine className="w-3 h-3 animate-pulse" />
          Quantum Content Decoder
        </div>
        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl relative z-10 drop-shadow-lg">
          Анализ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Контента</span>
        </h2>
        <p className="text-lg text-white/50 max-w-2xl font-light relative z-10">
          Прикрепите ссылку на Reels или TikTok. Наш AI деконструирует виральный код алгоритмов.
        </p>
      </div>

      {/* Deep Scan Input Section */}
      <div className="w-full max-w-2xl mx-auto space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group block"
        >
          {/* Animated Scanner Beam */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent z-0 animate-pulse rounded-xl pointer-events-none" />
          )}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-xl opacity-30 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

          <div className="relative flex items-center p-2 bg-black/80 rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
            <div className="pl-4 pr-3 flex items-center pointer-events-none text-cyan-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Вставьте ссылку на виральный контент..."
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-lg h-14 text-white placeholder:text-white/20 font-mono tracking-tight w-full"
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !url.trim()}
              className={cn(
                "h-12 px-8 rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg ml-2",
                isAnalyzing
                  ? "bg-cyan-500/20 text-cyan-400 cursor-wait"
                  : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/25 hover:scale-105 active:scale-95"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Binary className="w-4 h-4 mr-2" />
                  Decode
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <p className="text-[10px] text-center text-white/30 uppercase tracking-[0.2em] font-mono">
          Supported Protocols: Instagram Reels • TikTok • YouTube Shorts
        </p>
      </div>

      {/* Result Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="max-w-6xl mx-auto w-full"
        >
          <div className="grid gap-6 lg:grid-cols-12 h-full">

            {/* Left Column: Core Analysis (Decoded Signals) */}
            <div className="lg:col-span-5 space-y-6 flex flex-col">
              <Card className="border border-white/10 bg-black/40 backdrop-blur-xl shadow-xl overflow-hidden relative group h-full">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
                <CardHeader className="pb-4 border-b border-white/5">
                  <CardTitle className="flex items-center text-lg text-white font-mono uppercase tracking-wider">
                    <Fingerprint className="w-5 h-5 mr-3 text-cyan-400" />
                    Signal Identification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Core Topic
                    </h4>
                    <p className="text-xl text-white font-bold leading-tight">{result.topic}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                      Viral Hook
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-pink-500/10 to-transparent border-l-2 border-pink-500 text-white font-medium text-lg leading-relaxed shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                      "{result.hook}"
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-black/40 backdrop-blur-xl shadow-xl overflow-hidden relative group flex-1">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-tr-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
                <CardHeader className="pb-4 border-b border-white/5">
                  <CardTitle className="flex items-center text-lg text-white font-mono uppercase tracking-wider">
                    <Cpu className="w-5 h-5 mr-3 text-purple-400" />
                    Virality DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {result.virality_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-white/90 group/item">
                        <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 shrink-0 group-hover/item:text-purple-300 transition-colors" />
                        <span className="group-hover/item:translate-x-1 transition-transform">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Structure & Action */}
            <div className="lg:col-span-7 space-y-6 flex flex-col">
              <Card className="border border-white/10 bg-black/40 backdrop-blur-xl h-full flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

                <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                  <CardTitle className="flex items-center text-lg text-white font-mono uppercase tracking-wider justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-3 text-emerald-400" />
                      Script Sequence
                    </div>
                    <div className="text-[10px] text-white/30 bg-black/50 px-2 py-1 rounded">
                      {result.script_structure.length} NODES DETECTED
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-0 p-0">
                  <div className="relative p-6 space-y-4">
                    {/* Connecting Line */}
                    <div className="absolute top-8 bottom-8 left-[35px] w-0.5 bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent" />

                    {result.script_structure.map((step, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 group">
                        <span className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-[#111] border border-white/10 text-white/50 text-xs font-mono font-bold shrink-0 shadow-lg group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                          {idx + 1}
                        </span>
                        <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                          <p className="text-sm text-white/90 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 pt-0 mt-4">
                    <div className="flex items-center gap-3 text-emerald-400 font-bold bg-emerald-950/30 px-4 py-3 rounded-xl border border-emerald-500/20 mb-6">
                      <MessageCircle className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-500 opacity-70">Call to Action</div>
                        <div className="text-sm">{result.cta}</div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateScenario}
                      disabled={isCreating}
                      className="w-full h-16 text-xl font-bold uppercase tracking-widest bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all group scale-100 hover:scale-[1.01]"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Reconstructing...
                        </>
                      ) : (
                        <>
                          <Cpu className="w-6 h-6 mr-3" />
                          Initialize Remake
                          <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                    <p className="text-[10px] text-center text-white/30 mt-3 font-mono">
                      TRANSMITTING STRUCTURE TO PRODUCTION PIPELINE...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </motion.div>
      )}
    </div>
  );
};
