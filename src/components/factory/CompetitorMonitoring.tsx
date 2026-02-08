import React, { useState } from 'react';
import { useContentFactory } from '@/hooks/useContentFactory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Instagram,
  Trash2,
  Search,
  Plus,
  Globe,
  Loader2,
  Sparkles,
  Zap,
  Play,
  FileText,
  Target,
  Users,
  Scan,
  Activity,
  BarChart3,
  ExternalLink,
  Radar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompetitorMonitoringProps {
  projectId: string;
}

export const CompetitorMonitoring = ({ projectId }: CompetitorMonitoringProps) => {
  const { competitors, addCompetitor, deleteCompetitor, updateCompetitor, loading } = useContentFactory(projectId);
  const [newHandle, setNewHandle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({});

  // Auto-detect platform based on input
  const detectPlatform = (text: string): 'instagram' | 'tiktok' => {
    const lower = text.toLowerCase();
    if (lower.includes('tiktok.com')) return 'tiktok';
    return 'instagram'; // Default to Instagram
  };

  const currentPlatform = detectPlatform(newHandle);

  const handleAdd = async () => {
    if (!newHandle.trim()) {
      toast.error('Введите логин или ссылку');
      return;
    }

    setIsAdding(true);
    // Clean handle logic
    let handle = newHandle.trim();
    if (handle.includes('instagram.com/')) handle = handle.split('instagram.com/')[1].replace(/\/$/, '').replace('/', '');
    if (handle.includes('tiktok.com/@')) handle = handle.split('tiktok.com/@')[1].replace(/\/$/, '').replace('/', '');
    if (handle.startsWith('@')) handle = handle.substring(1);

    // Remove query params if any
    if (handle.includes('?')) handle = handle.split('?')[0];

    await addCompetitor(currentPlatform, handle);
    setNewHandle('');
    setIsAdding(false);
  };

  const handleAnalyze = async (competitor: any) => {
    try {
      setAnalyzingIds(prev => ({ ...prev, [competitor.id]: true }));
      toast.info(`Запуск анализа @${competitor.handle}...`);

      const { data, error } = await supabase.functions.invoke('analyze-competitor', {
        body: {
          handle: competitor.handle,
          platform: competitor.platform
        }
      });

      if (error) throw error;

      await updateCompetitor(competitor.id, {
        top_content_links: data, // Storing the analysis result here
        last_scanned_at: new Date().toISOString()
      });

      toast.success(`Анализ @${competitor.handle} завершен!`);

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Ошибка анализа конкурента');
    } finally {
      setAnalyzingIds(prev => ({ ...prev, [competitor.id]: false }));
    }
  };

  const platformConfig = {
    instagram: {
      label: 'Instagram',
      icon: <Instagram className="w-5 h-5" />,
      color: 'text-pink-400',
      borderColor: 'border-pink-500/50',
      glow: 'shadow-[0_0_15px_rgba(236,72,153,0.3)]',
    },
    tiktok: {
      label: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/50',
      glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    }
  };

  const activeConfig = platformConfig[currentPlatform];

  return (
    <div className="h-full flex flex-col p-8 space-y-10 overflow-y-auto bg-transparent font-sans">

      {/* Header with animated scanner effect */}
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full text-center items-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium uppercase tracking-wider mb-2 backdrop-blur-md">
          <Radar className="w-3 h-3 animate-spin-slow" />
          Neural Surveillance System
        </div>
        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl relative z-10 drop-shadow-lg">
          Мониторинг <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Конкурентов</span>
        </h2>
        <p className="text-lg text-white/50 max-w-2xl relative z-10 font-light">
          Сканирование социальных профилей. Сбор данных. Генерация инсайтов.
        </p>
      </div>

      {/* Scanner Input Section */}
      <div className="max-w-2xl mx-auto w-full relative z-10">
        <div className="relative group">
          {/* Animated Glow Border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 rounded-2xl opacity-30 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

          <div className="relative flex items-center bg-black/80 rounded-xl shadow-2xl border border-white/10 p-2 pl-4 h-16 transition-all duration-300 backdrop-blur-xl">

            {/* Platform Icon Indicator */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-300 mr-3 bg-white/5 border border-white/10 text-white"
            )}>
              {activeConfig.icon}
            </div>

            <Input
              placeholder="Введите @username или вставьте ссылку..."
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent text-lg h-full text-white placeholder:text-white/30 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />

            <Button
              onClick={handleAdd}
              disabled={isAdding}
              className="h-12 px-6 rounded-lg text-black font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ml-2 bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/25"
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <div className="flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  <span>СКАН</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-3 flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-white/30 font-mono">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            Instagram Protocol
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse delay-100" />
            TikTok Protocol
          </span>
        </div>
      </div>

      {/* Competitors Grid (Data Nodes) */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
        <AnimatePresence mode='popLayout'>
          {competitors.map((comp, index) => {
            const config = platformConfig[comp.platform as keyof typeof platformConfig] || platformConfig.instagram;
            const isAnalyzing = analyzingIds[comp.id];
            const hasAnalysis = !!comp.top_content_links;
            const analysis = comp.top_content_links as any;

            return (
              <motion.div
                key={comp.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group relative bg-black/40 rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col backdrop-blur-md",
                  config.borderColor.replace('50', '20')
                )}
              >
                {/* Node Status Line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className={cn("absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity", config.color)} />

                <div className="p-6 pb-4 flex-1 relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar / Icon Node */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-black/50 backdrop-blur-xl text-white transition-all group-hover:scale-110",
                        config.borderColor,
                        config.glow
                      )}>
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg tracking-tight font-mono">@{comp.handle}</h3>
                        <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                          <Activity className="w-3 h-3" />
                          Target: {config.label}
                        </p>
                      </div>
                    </div>
                    {hasAnalysis && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20 animate-pulse" />
                        <span className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                          <Sparkles className="w-3 h-3" />
                          Ready
                        </span>
                      </div>
                    )}
                  </div>

                  {hasAnalysis && (
                    <div className="space-y-4 mb-4">
                      <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          <Target className="w-3 h-3" />
                          Niche Detected
                        </div>
                        <div className="text-sm text-white/90 truncate">{analysis.niche}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          <Users className="w-3 h-3" />
                          Audience Profile
                        </div>
                        <div className="text-sm text-white/90 truncate">{analysis.target_audience?.slice(0, 30)}...</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono uppercase">
                      <Zap className="w-3 h-3 text-yellow-500/50" />
                      <span>{comp.last_scanned_at ? `SCAN: ${new Date(comp.last_scanned_at).toLocaleDateString()}` : 'NO DATA'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-black/40 p-4 border-t border-white/10 flex items-center gap-3 relative z-10 backdrop-blur-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 gap-2 font-bold uppercase tracking-wider text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white transition-all",
                      isAnalyzing && "opacity-80 cursor-wait"
                    )}
                    onClick={() => handleAnalyze(comp)}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Radar className="w-3 h-3 text-emerald-400" />
                        {hasAnalysis ? 'Rescan' : 'Analyze'}
                      </>
                    )}
                  </Button>

                  {hasAnalysis && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold uppercase tracking-wider text-xs">
                          <FileText className="w-3 h-3 mr-2" />
                          Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0a0a0a]/95 border border-white/10 backdrop-blur-2xl p-0 gap-0 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        {/* Holographic Header */}
                        <DialogHeader className="p-6 border-b border-white/10 bg-white/5">
                          <DialogTitle className="flex items-center gap-3 text-xl text-white font-mono">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                              <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Target Analysis Report</div>
                              @{comp.handle}
                            </div>
                          </DialogTitle>
                        </DialogHeader>

                        <ScrollArea className="flex-1">
                          <div className="p-6 space-y-8">

                            {/* Strategy Core */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <h4 className="text-xs font-bold text-white/50 mb-3 uppercase tracking-wider flex items-center gap-2">
                                  <Target className="w-3 h-3 text-emerald-400" />
                                  Core Niche
                                </h4>
                                <p className="text-lg text-white font-medium leading-tight">{analysis.niche}</p>
                              </div>
                              <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <h4 className="text-xs font-bold text-white/50 mb-3 uppercase tracking-wider flex items-center gap-2">
                                  <Users className="w-3 h-3 text-emerald-400" />
                                  Audience Segment
                                </h4>
                                <p className="text-sm text-white/80 leading-relaxed">{analysis.target_audience}</p>
                              </div>
                            </div>

                            {/* Strategy Text */}
                            {analysis.strategy_summary && (
                              <div className="bg-gradient-to-br from-emerald-950/30 to-black p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                  <BarChart3 className="w-32 h-32" />
                                </div>
                                <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider relative z-10">Strategic Intelligence</h4>
                                <p className="text-base text-white/90 leading-relaxed relative z-10">{analysis.strategy_summary}</p>
                              </div>
                            )}

                            {/* Viral Ideas Grid */}
                            <div>
                              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                Detected Viral Vectors ({analysis.ideas?.length || 0})
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {analysis.ideas?.map((idea: any, i: number) => (
                                  <div key={i} className="group bg-white/5 p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all flex gap-4">
                                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-black/40 border border-white/5 w-12 h-12 text-white/30 font-mono font-bold text-lg group-hover:text-emerald-400 transition-colors">
                                      {i + 1}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-bold text-white text-lg mb-1">{idea.title}</h5>
                                      <p className="text-sm text-white/60 mb-3">{idea.concept}</p>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 text-xs">
                                          Why Viral: {idea.why_viral}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCompetitor(comp.id)}
                    className="text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {competitors.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-white/30 border border-dashed border-white/10 rounded-3xl bg-white/5">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
              <Radar className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-mono font-bold text-xl text-white/50 tracking-widest uppercase">Target List Empty</p>
            <p className="text-sm opacity-50 mt-2 max-w-sm text-center">Initialize first target scan to begin intelligence gathering</p>
          </div>
        )}
      </div>
    </div>
  );
};
