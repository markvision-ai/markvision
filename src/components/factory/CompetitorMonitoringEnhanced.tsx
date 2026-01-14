import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ExternalLink, Clock, Instagram, MessageCircle, Sparkles, TrendingUp, Eye, ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { Competitor } from '@/hooks/useContentFactory';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface CompetitorMonitoringProps {
  competitors: Competitor[];
  projectId: string | null;
  onAdd: (accountHandle: string, platform: string) => Promise<Competitor | null>;
  onRemove: (id: string) => Promise<boolean>;
  onCreateFromIdea: (title: string, sourceUrl?: string) => Promise<unknown>;
}

const platformConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  instagram: { label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
  tiktok: { label: 'TikTok', icon: <MessageCircle className="w-4 h-4" /> },
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Тренд
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${idea.virality >= 90 ? 'border-green-500 text-green-600' : idea.virality >= 70 ? 'border-yellow-500 text-yellow-600' : 'border-gray-500'}`}
            >
              🔥 {idea.virality}% виральность
            </Badge>
          </div>
          
          <h4 className="font-semibold mb-2">{idea.topic}</h4>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {idea.reach} охват
            </span>
            <span className="text-xs">
              Источник: {idea.source}
            </span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          onClick={onCreateContent}
          disabled={isCreating}
          className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              В производство
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

  return (
    <div className="space-y-6">
      {/* Add Competitor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Добавить конкурента
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="@username (например @dr.smile.kz)"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Select value={newPlatform} onValueChange={setNewPlatform}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={isAdding || !newHandle.trim()} className="gap-2">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Добавить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Competitors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Отслеживаемые аккаунты ({competitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Instagram className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Нет отслеживаемых конкурентов</p>
              <p className="text-sm mt-1">Добавьте аккаунты для мониторинга идей</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {competitors.map((competitor) => {
                  const platform = platformConfig[competitor.platform] || platformConfig.instagram;
                  
                  return (
                    <motion.div
                      key={competitor.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white">
                          {platform.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{competitor.account_handle}</span>
                          </div>
                          {competitor.last_scanned_at && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Clock className="w-3 h-3" />
                              {format(new Date(competitor.last_scanned_at), 'dd MMM HH:mm', { locale: ru })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(
                            competitor.platform === 'instagram'
                              ? `https://instagram.com/${competitor.account_handle.replace('@', '')}`
                              : `https://tiktok.com/${competitor.account_handle}`,
                            '_blank'
                          )}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRemove(competitor.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Ideas Feed */}
      <Card className="border-violet-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Свежие идеи от ИИ
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-xs">
              AI Анализ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Добавьте конкурентов для анализа</p>
              <p className="text-sm mt-1">ИИ проанализирует их контент и предложит идеи</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {ideas.map((idea, index) => (
                  <IdeaCard
                    key={index}
                    idea={idea}
                    onCreateContent={() => handleCreateFromIdea(idea, index)}
                    isCreating={creatingIdeaIndex === index}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
