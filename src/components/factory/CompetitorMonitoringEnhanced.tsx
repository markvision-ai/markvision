import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ExternalLink, Clock, Instagram, MessageCircle, Sparkles, TrendingUp, Eye, ArrowRight, Loader2, Lightbulb, BarChart2, Zap, User } from 'lucide-react';
import { Competitor } from '@/hooks/useContentFactory';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CompetitorMonitoringProps {
  competitors: Competitor[];
  projectId: string | null;
  onAdd: (accountHandle: string, platform: string) => Promise<Competitor | null>;
  onRemove: (id: string) => Promise<boolean>;
  onCreateFromIdea: (title: string, sourceUrl?: string) => Promise<unknown>;
}

const platformConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  instagram: { label: 'Instagram', icon: <Instagram className="w-4 h-4" />, color: 'from-pink-500 to-rose-500' },
  tiktok: { label: 'TikTok', icon: <MessageCircle className="w-4 h-4" />, color: 'from-black to-slate-800' },
};

// Simulated AI-generated ideas based on competitors
const generateMockIdeas = (competitors: Competitor[]) => {
  const trendTopics = [
    { topic: 'Секреты отбеливания зубов за 1 час', reach: '150K-300K', virality: 92, source: '@dr.smile.kz' },
    { topic: 'Почему болят дёсны? 5 причин', reach: '80K-150K', virality: 78, source: '@dentist.almaty' },
    { topic: 'Имплантация без боли: миф или реальность?', reach: '200K-400K', virality: 95, source: '@stomatology.pro' },
    { topic: 'Как выбрать правильную зубную щётку', reach: '50K-100K', virality: 65, source: '@healthy.teeth' },
    { topic: 'Виниры vs Коронки: что лучше?', reach: '120K-250K', virality: 88, source: '@smile.design' },
  ];

  return trendTopics.slice(0, Math.min(5, competitors.length > 0 ? 5 : 2));
};

interface IdeaCardProps {
  idea: {
    topic: string;
    reach: string;
    virality: number;
    source: string;
  };
  onCreateContent: () => void;
  isCreating: boolean;
}

const IdeaCard = ({ idea, onCreateContent, isCreating }: IdeaCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      className="group relative p-5 bg-card/40 hover:bg-card/60 backdrop-blur-md border border-border/40 hover:border-primary/20 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-600 " />
            </div>
            <Badge variant="secondary" className="bg-secondary/50 backdrop-blur-sm text-[10px] border-0 font-medium tracking-wide">
              <TrendingUp className="w-3 h-3 mr-1" />
              ТРЕНД
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] border font-medium backdrop-blur-sm",
                idea.virality >= 90 
                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" 
                  : "border-amber-500/30 text-amber-600 bg-amber-500/5"
              )}
            >
              🔥 {idea.virality}% ВИРАЛЬНОСТЬ
            </Badge>
          </div>
          
          <h4 className="font-semibold text-base leading-tight text-foreground/90 group-hover:text-primary transition-colors duration-300">
            {idea.topic}
          </h4>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground/70 font-medium">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {idea.reach}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-border" />
              Источник: {idea.source}
            </span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          onClick={onCreateContent}
          disabled={isCreating}
          className="w-full sm:w-auto gap-2 rounded-xl bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Создать</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export const CompetitorMonitoringEnhanced = ({
  competitors,
  projectId,
  onAdd,
  onRemove,
  onCreateFromIdea,
}: CompetitorMonitoringProps) => {
  const [newHandle, setNewHandle] = useState('');
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [isAdding, setIsAdding] = useState(false);
  const [creatingIdeaIndex, setCreatingIdeaIndex] = useState<number | null>(null);

  const ideas = generateMockIdeas(competitors);

  const handleAdd = async () => {
    if (!newHandle.trim()) return;
    
    setIsAdding(true);
    const result = await onAdd(newHandle.trim(), newPlatform);
    setIsAdding(false);
    
    if (result) {
      setNewHandle('');
      toast.success('Конкурент добавлен для мониторинга');
    }
  };

  const handleCreateFromIdea = async (idea: typeof ideas[0], index: number) => {
    setCreatingIdeaIndex(index);
    await onCreateFromIdea(idea.topic, `https://instagram.com/${idea.source.replace('@', '')}`);
    setCreatingIdeaIndex(null);
    toast.success('Идея отправлена в Цех 1 (Сценарий)');
  };

  const handleSendToGenerator = async (competitor: Competitor) => {
      const sourceUrl = competitor.platform === 'instagram'
        ? `https://instagram.com/${competitor.handle.replace('@', '')}`
        : `https://tiktok.com/${competitor.handle}`;
      
      await onCreateFromIdea(
          `Анализ конкурента: @${competitor.handle}`,
          sourceUrl
      );
      toast.success(`@${competitor.handle} отправлен в генератор!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-1">
      {/* Left Column: Competitors List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-3xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)]">
            <div className="p-5 border-b border-border/40 bg-muted/10">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-primary" />
                    Мониторинг
                    <Badge variant="secondary" className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-normal">
                        {competitors.length}
                    </Badge>
                </h3>
                
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            placeholder="@username"
                            value={newHandle}
                            onChange={(e) => setNewHandle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            className="pr-20 bg-background/50 border-border/50 focus:bg-background transition-all rounded-xl"
                        />
                         <Select value={newPlatform} onValueChange={setNewPlatform}>
                            <SelectTrigger className="absolute right-0 top-0 h-10 w-[40px] border-0 bg-transparent focus:ring-0 px-2 text-muted-foreground hover:text-foreground">
                                {newPlatform === 'instagram' ? <Instagram className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="tiktok">TikTok</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        onClick={handleAdd} 
                        disabled={isAdding || !newHandle.trim()} 
                        size="icon"
                        className="rounded-xl shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all duration-300"
                    >
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {competitors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                            <Instagram className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Нет аккаунтов</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Добавьте конкурентов для слежки</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {competitors.map((competitor) => {
                            const platform = platformConfig[competitor.platform] || platformConfig.instagram;
                            return (
                                <motion.div
                                    key={competitor.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="group flex flex-col p-3 rounded-2xl border border-transparent hover:border-border/50 bg-transparent hover:bg-background/60 hover:shadow-sm transition-all duration-200"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-10 w-10 border border-border">
                                                <AvatarImage src={competitor.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {competitor.handle ? competitor.handle[0].toUpperCase() : <User className="w-4 h-4" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate pr-2">{competitor.handle}</p>
                                                {competitor.last_scanned_at && (
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(competitor.last_scanned_at), 'd MMM HH:mm', { locale: ru })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary"
                                                onClick={() => window.open(
                                                    competitor.platform === 'instagram'
                                                        ? `https://instagram.com/${competitor.handle.replace('@', '')}`
                                                        : `https://tiktok.com/${competitor.handle}`,
                                                    '_blank'
                                                )}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => onRemove(competitor.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Button 
                                        variant="default" 
                                        size="sm"
                                        className="w-full text-xs h-8 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        onClick={() => handleSendToGenerator(competitor)}
                                    >
                                        <Zap className="w-3 h-3 mr-2" />
                                        В ГЕНЕРАТОР MarkVision
                                    </Button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
      </div>

      {/* Right Column: AI Ideas Feed */}
      <div className="lg:col-span-2">
         <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-xl p-6 h-full min-h-[500px] flex flex-col relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-background/50 backdrop-blur-md rounded-xl border border-primary/10 shadow-sm">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight">AI Лаборатория идей</h3>
                        <p className="text-xs text-muted-foreground font-medium">Анализ {competitors.length} конкурентов</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl bg-background/30 backdrop-blur-md border-primary/10 hover:bg-primary/5">
                    <BarChart2 className="w-4 h-4" />
                    Отчет
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 relative z-10 pr-2">
                {competitors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <h4 className="text-base font-medium text-foreground/80">Лаборатория пуста</h4>
                        <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                            Добавьте конкурентов, чтобы ИИ начал генерировать гипотезы и сценарии
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {ideas.map((idea, index) => (
                            <IdeaCard
                                key={index}
                                idea={idea}
                                onCreateContent={() => handleCreateFromIdea(idea, index)}
                                isCreating={creatingIdeaIndex === index}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};
