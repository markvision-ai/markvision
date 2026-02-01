import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  MousePointerClick, 
  MessageSquare,
  BarChart3,
  Play,
  Pause,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { toast } from 'sonner';

// Твой Project ID из паспорта
const MARK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

interface Recommendation {
  id: string;
  project_id: string;
  created_at: string;
  [key: string]: any; // Allow for other fields
}

export const AdsOptimizer = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdsData();
  }, []);

  const fetchAdsData = async () => {
    try {
      // Здесь мы будем тянуть рекомендации, которые Claude Code записал в базу
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('project_id', MARK_PROJECT_ID)
        .order('created_at', { ascending: false });

      if (data) setRecommendations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async (_id: string) => {
    toast.promise(
      // Эмуляция вызова n8n через вебхук
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'ИИ применяет изменения в Meta Ads...',
        success: 'Бюджет успешно обновлен через MCP!',
        error: 'Ошибка доступа к Meta API',
      }
    );
  };

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="text-purple-500 w-8 h-8" />
            AI Ads Agent v2.1
          </h1>
          <p className="text-muted-foreground">Автономная оптимизация: Стоматология Уали</p>
        </div>
        <Badge variant="outline" className="border-purple-500 text-purple-400 px-4 py-1">
          MCP Meta Server: Online
        </Badge>
      </div>

      {/* Main recommendation (тот самый Вариант А) */}
      <BackgroundGradient className="rounded-[22px] p-1 bg-card">
        <div className="bg-card rounded-[20px] p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Badge className="bg-purple-600 mb-2">РЕКОМЕНДАЦИЯ №1</Badge>
              <h2 className="text-2xl font-bold">Масштабирование: "Восстановим зубы недорого"</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Прогноз роста лидов</p>
              <p className="text-2xl font-bold text-green-500">+45%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MousePointerClick size={16} /> <span>CTR (Кликабельность)</span>
              </div>
              <p className="text-xl font-mono">4.13%</p>
              <Progress value={82} className="h-1 mt-2 bg-purple-900" />
            </div>
            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MessageSquare size={16} /> <span>Цена сообщения</span>
              </div>
              <p className="text-xl font-mono">112 ₸</p>
              <p className="text-xs text-green-400">На 30% ниже рынка</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp size={16} /> <span>ROI Прогноз</span>
              </div>
              <p className="text-xl font-mono">x5.2</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-bold"
              onClick={() => applyRecommendation('1')}
            >
              <Zap className="mr-2 fill-current" /> Применить: Увеличить бюджет на 50%
            </Button>
            <Button variant="outline" className="border-border h-12">
              Игнорировать
            </Button>
          </div>
        </div>
      </BackgroundGradient>

      {/* Secondary Actions (Варианты B и C) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle size={20} /> Приостановить "Стесняются улыбаться"
            </CardTitle>
            <CardDescription>Выгорание аудитории. Цена лида выросла до 2,500 ₸</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full" onClick={() => applyRecommendation('stop')}>
              Остановить объявление
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <BarChart3 size={20} /> Отчет для Юрия (n8n)
            </CardTitle>
            <CardDescription>Сгенерировать PDF-отчет по расходам за неделю</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-border">
              Отправить в Telegram
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};