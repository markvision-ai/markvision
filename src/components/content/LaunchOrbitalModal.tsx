import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, DollarSign, Target, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface LaunchOrbitalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postData: {
    post_id: string;
    caption: string | null;
    media_url: string | null;
    permalink: string | null;
  };
}

export const LaunchOrbitalModal = ({ open, onOpenChange, postData }: LaunchOrbitalModalProps) => {
  const [budget, setBudget] = useState<number>(50000);
  const [duration, setDuration] = useState<number>(7);
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`Продвижение запущено! Бюджет: ${budget.toLocaleString('ru-RU')} ₸`, {
      description: `Пост будет продвигаться ${duration} дней`
    });
    
    setLaunching(false);
    onOpenChange(false);
  };

  const estimatedReach = Math.round(budget * 10); // Примерный охват
  const estimatedLeads = Math.round(budget / 500); // Примерное кол-во лидов

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-violet-50/50 via-purple-50/30 to-pink-50/50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-pink-950/20 backdrop-blur-xl border-violet-200/50 dark:border-violet-800/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Продвижение поста
              </DialogTitle>
              <DialogDescription className="mt-1">
                Запустите рекламу для этого контента
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Preview */}
          {postData.media_url && (
            <div className="relative rounded-xl overflow-hidden border-2 border-violet-200/50 dark:border-violet-800/50 shadow-lg">
              {postData.media_url.includes('video') || postData.media_url.includes('.mp4') ? (
                <video 
                  src={postData.media_url} 
                  className="w-full h-48 object-cover"
                  controls={false}
                  muted
                  loop
                  autoPlay
                />
              ) : (
                <img 
                  src={postData.media_url} 
                  alt="Post preview" 
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <p className="text-white text-sm line-clamp-2">
                  {postData.caption || 'Без описания'}
                </p>
              </div>
            </div>
          )}

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-violet-600" />
              Бюджет на продвижение
            </Label>
            <div className="relative">
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="pr-8 border-violet-200 dark:border-violet-800 focus:border-violet-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₸
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Рекомендуем: от 30,000₸ для эффективного охвата
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              Длительность
            </Label>
            <div className="relative">
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={30}
                className="pr-16 border-violet-200 dark:border-violet-800 focus:border-violet-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                дней
              </span>
            </div>
          </div>

          {/* Predictions */}
          <div className="bg-gradient-to-br from-violet-100/50 to-purple-100/50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 space-y-3 border border-violet-200/50 dark:border-violet-800/50">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-600" />
              Прогнозируемые результаты
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground">Охват</p>
                <p className="text-lg font-bold text-violet-600">
                  {estimatedReach.toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground">Лиды</p>
                <p className="text-lg font-bold text-purple-600">
                  ~{estimatedLeads}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-violet-200/50 dark:border-violet-800/50">
              <Badge variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                CPL: {Math.round(budget / estimatedLeads).toLocaleString('ru-RU')} ₸
              </Badge>
              <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                CPM: {Math.round((budget / estimatedReach) * 1000).toLocaleString('ru-RU')} ₸
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {postData.permalink && (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.open(postData.permalink!, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Открыть пост
              </Button>
            )}
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              onClick={handleLaunch}
              disabled={launching}
            >
              <Rocket className="w-4 h-4" />
              {launching ? 'Запускаем...' : 'Запустить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
