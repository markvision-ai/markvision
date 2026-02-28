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
    <div className="h-full flex flex-col p-8 space-y-10 overflow-y-auto bg-white/5 font-sans">

      {/* Header */}
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full text-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium uppercase tracking-wider mb-2">
          <Radar className="w-3 h-3" />
          Мониторинг активности
        </div>
        <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          Мониторинг <span className="text-primary">Конкурентов</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl font-light">
          Сканирование социальных профилей. Сбор данных. Генерация инсайтов.
        </p>
      </div>

      {/* Scanner Input Section */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="relative group">
          <div className="relative flex items-center bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 rounded-xl p-2 pl-4 h-16 transition-all duration-300">

            {/* Platform Icon Indicator */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-300 mr-3 bg-muted text-muted-foreground"
            )}>
              {activeConfig.icon}
            </div>

            <Input
              placeholder="Введите @username или вставьте ссылку..."
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent text-lg h-full text-foreground placeholder:text-muted-foreground font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />

            <Button
              onClick={handleAdd}
              disabled={isAdding}
              className="h-12 px-6 rounded-lg font-bold shadow-sm transition-all duration-300 ml-2"
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
        <div className="mt-3 flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-muted-foreground font-mono opacity-60">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            Instagram Protocol
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
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
                  "group relative bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                )}
              >
                {/* Node Status Line */}
                <div className={cn("absolute top-0 left-0 w-full h-1 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity")} />

                <div className="p-6 pb-4 flex-1 relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar / Icon Node */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border bg-muted text-foreground transition-all group-hover:scale-110",
                        config.borderColor
                      )}>
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg tracking-tight font-mono">@{comp.handle}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                          <Activity className="w-3 h-3" />
                          Target: {config.label}
                        </p>
                      </div>
                    </div>
                    {hasAnalysis && (
                      <div className="relative">
                        <span className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                          <Sparkles className="w-3 h-3" />
                          Ready
                        </span>
                      </div>
                    )}
                  </div>

                  {hasAnalysis && (
                    <div className="space-y-4 mb-4">
                      <div className="p-3 bg-muted/50 rounded-lg border border-white/50">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                          <Target className="w-3 h-3" />
                          Niche Detected
                        </div>
                        <div className="text-sm text-foreground truncate">{analysis.niche}</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border border-white/50">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                          <Users className="w-3 h-3" />
                          Audience Profile
                        </div>
                        <div className="text-sm text-foreground truncate">{analysis.target_audience?.slice(0, 30)}...</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/50">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase">
                      <Zap className="w-3 h-3 text-yellow-500/50" />
                      <span>{comp.last_scanned_at ? `SCAN: ${new Date(comp.last_scanned_at).toLocaleDateString()}` : 'NO DATA'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-muted/30 p-4 border-t border-white/50 flex items-center gap-3 relative z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 gap-2 font-bold uppercase tracking-wider text-xs border border-white/50 hover:bg-muted transition-all",
                      isAnalyzing && "opacity-80 cursor-wait"
                    )}
                    onClick={() => handleAnalyze(comp)}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Radar className="w-3 h-3 text-primary" />
                        {hasAnalysis ? 'Rescan' : 'Analyze'}
                      </>
                    )}
                  </Button>

                  {hasAnalysis && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm" className="font-bold uppercase tracking-wider text-xs">
                          <FileText className="w-3 h-3 mr-2" />
                          Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-white/10 backdrop-blur-3xl border border-white/80 p-0 gap-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl">
                        {/* Header */}
                        <DialogHeader className="p-6 border-b border-slate-100 bg-white/50">
                          <DialogTitle className="flex items-center gap-3 text-xl text-foreground font-mono">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-primary mb-1">Target Analysis Report</div>
                              @{comp.handle}
                            </div>
                          </DialogTitle>
                        </DialogHeader>

                        <ScrollArea className="flex-1">
                          <div className="p-6 space-y-8">

                            {/* Strategy Core */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-5 rounded-2xl border border-white/50">
                                <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                                  <Target className="w-3 h-3 text-primary" />
                                  Core Niche
                                </h4>
                                <p className="text-lg text-foreground font-medium leading-tight">{analysis.niche}</p>
                              </div>
                              <div className="bg-muted/30 p-5 rounded-2xl border border-white/50">
                                <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                                  <Users className="w-3 h-3 text-primary" />
                                  Audience Segment
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.target_audience}</p>
                              </div>
                            </div>

                            {/* Strategy Text */}
                            {analysis.strategy_summary && (
                              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                  <BarChart3 className="w-32 h-32" />
                                </div>
                                <h4 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider relative z-10">Strategic Intelligence</h4>
                                <p className="text-base text-foreground/90 leading-relaxed relative z-10">{analysis.strategy_summary}</p>
                              </div>
                            )}

                            {/* Viral Ideas Grid */}
                            <div>
                              <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                Detected Viral Vectors ({analysis.ideas?.length || 0})
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {analysis.ideas?.map((idea: any, i: number) => (
                                  <div key={i} className="group bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-4 rounded-xl border border-white/50 hover:border-primary/50 hover:bg-muted/30 transition-all flex gap-4">
                                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted border border-white/50 w-12 h-12 text-muted-foreground font-mono font-bold text-lg group-hover:text-primary transition-colors">
                                      {i + 1}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-bold text-foreground text-lg mb-1">{idea.title}</h5>
                                      <p className="text-sm text-muted-foreground mb-3">{idea.concept}</p>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
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
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {competitors.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-muted-foreground/30 border border-dashed border-white/50 rounded-3xl bg-white/10">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Radar className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-mono font-bold text-xl text-muted-foreground/50 tracking-widest uppercase">Target List Empty</p>
            <p className="text-sm opacity-50 mt-2 max-w-sm text-center">Initialize first target scan to begin intelligence gathering</p>
          </div>
        )}
      </div>
    </div>
  );
};
