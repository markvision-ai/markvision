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
  Users
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
      color: 'text-pink-600',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-pink-50',
      border: 'border-pink-200'
    },
    tiktok: {
      label: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
      color: 'text-black',
      gradient: 'from-slate-900 to-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200'
    }
  };

  const activeConfig = platformConfig[currentPlatform];

  return (
    <div className="h-full flex flex-col p-8 space-y-10 overflow-y-auto bg-slate-50/50">
      
      {/* Header with animated gradient text */}
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full text-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-medium uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3" />
          AI Intelligence
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Мониторинг <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Конкурентов</span>
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl">
          Добавьте ссылки на профили Instagram или TikTok. Наш AI автоматически соберет лучший контент для генерации новых идей.
        </p>
      </div>

      {/* Modern Input Section */}
      <div className="max-w-2xl mx-auto w-full relative z-10">
        <div className="relative group">
          {/* Glow effect */}
          <div className={cn(
            "absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-20 group-hover:opacity-40 blur transition duration-500",
            activeConfig.gradient
          )} />
          
          <div className="relative flex items-center bg-white rounded-xl shadow-xl border border-slate-100 p-2 pl-4 h-16 transition-all duration-300 ring-1 ring-slate-900/5 focus-within:ring-2 focus-within:ring-purple-500/50">
            
            {/* Platform Icon Indicator */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-300 mr-3",
              activeConfig.bg,
              activeConfig.color
            )}>
              {activeConfig.icon}
            </div>

            <Input
              placeholder="Вставьте ссылку или @username..."
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent text-lg h-full placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />

            <Button 
              onClick={handleAdd} 
              disabled={isAdding}
              className={cn(
                "h-12 px-6 rounded-lg text-white font-medium shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ml-2",
                currentPlatform === 'instagram' 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/25" 
                  : "bg-black hover:bg-slate-800 shadow-slate-500/25"
              )}
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span>Добавить</span>
                </div>
              )}
            </Button>
          </div>
        </div>
        
        {/* Helper text */}
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 transition-colors hover:text-pink-500">
            <Instagram className="w-3 h-3" />
            Поддерживается Instagram
          </span>
          <span className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
            Поддерживается TikTok
          </span>
        </div>
      </div>

      {/* Competitors Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-8">
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
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="p-6 pb-4 flex-1">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm", config.bg, config.color, config.border)}>
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg tracking-tight">@{comp.handle}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Globe className="w-3 h-3" />
                          {config.label}
                        </p>
                      </div>
                    </div>
                    {hasAnalysis && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                        <Sparkles className="w-3 h-3" />
                        Анализ готов
                      </span>
                    )}
                  </div>

                  {hasAnalysis && (
                     <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <Target className="w-3.5 h-3.5 text-purple-500" />
                          Ниша: {analysis.niche}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          ЦА: {analysis.target_audience?.slice(0, 30)}...
                        </div>
                     </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{comp.last_scanned_at ? `Обновлено: ${new Date(comp.last_scanned_at).toLocaleDateString()}` : 'Не сканировалось'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn("flex-1 gap-2 font-medium", isAnalyzing && "opacity-80")}
                    onClick={() => handleAnalyze(comp)}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        Анализируем...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-purple-600" />
                        {hasAnalysis ? 'Обновить' : 'Анализировать'}
                      </>
                    )}
                  </Button>

                  {hasAnalysis && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                          <FileText className="w-4 h-4 mr-2" />
                          Отчет
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Анализ конкурента @{comp.handle}
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                          <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                  <Target className="w-4 h-4 text-purple-500" />
                                  Ниша
                                </h4>
                                <p className="text-sm text-slate-600">{analysis.niche}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                  <Users className="w-4 h-4 text-blue-500" />
                                  Целевая аудитория
                                </h4>
                                <p className="text-sm text-slate-600">{analysis.target_audience}</p>
                              </div>
                            </div>

                            {analysis.strategy_summary && (
                              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                <h4 className="text-sm font-semibold text-purple-900 mb-2">Стратегия</h4>
                                <p className="text-sm text-purple-700 leading-relaxed">{analysis.strategy_summary}</p>
                              </div>
                            )}

                            <div>
                              <h4 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Вирусные идеи (5)
                              </h4>
                              <div className="space-y-3">
                                {analysis.ideas?.map((idea: any, i: number) => (
                                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-purple-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <h5 className="font-bold text-slate-900 mb-1">{idea.title}</h5>
                                        <p className="text-sm text-slate-600 mb-3">{idea.concept}</p>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                                            Why Viral: {idea.why_viral}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                                        #{i + 1}
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
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {competitors.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <Search className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-lg text-slate-600">Список отслеживания пуст</p>
            <p className="text-sm opacity-60 mt-1 max-w-sm text-center">Добавьте первого конкурента, чтобы начать сбор идей и аналитику</p>
          </div>
        )}
      </div>
    </div>
  );
};
