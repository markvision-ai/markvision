import React from 'react';
import { useFactoryStore, ContentType } from './store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Video, 
  Film, 
  Images, 
  Type, 
  FileText, 
  Send,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CreationCenter = () => {
  const { activeScriptId, scripts, productionLines, startProduction, approveAllToPosting } = useFactoryStore();
  const activeScript = scripts.find(s => s.id === activeScriptId);

  if (!activeScript) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/5 text-muted-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="text-center relative z-10 max-w-sm mx-auto p-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Центр Генерации</h3>
          <p className="text-muted-foreground mb-8">
            Выберите сценарий из списка слева, чтобы запустить производство контента для разных платформ
          </p>
          <div className="flex justify-center gap-2 opacity-50">
             <div className="w-2 h-2 rounded-full bg-foreground/20" />
             <div className="w-2 h-2 rounded-full bg-foreground/20" />
             <div className="w-2 h-2 rounded-full bg-foreground/20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
      
      {/* Toolbar */}
      <div className="h-20 border-b border-border px-8 flex items-center justify-between bg-background/80 backdrop-blur-sm z-10 sticky top-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Project
            </Badge>
            <span className="text-xs text-muted-foreground font-mono opacity-50">ID: {activeScript.id.slice(0, 8)}</span>
          </div>
          <h2 className="text-xl font-bold truncate max-w-md text-foreground flex items-center gap-2">
            {activeScript.title}
          </h2>
        </div>
        <Button 
          onClick={approveAllToPosting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95"
          size="lg"
        >
          <Send className="w-4 h-4 mr-2" />
          Утвердить всё в публикацию
        </Button>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 p-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pb-20">
          <ProductionCard 
            type="avatar_video" 
            title="Avatar Video" 
            icon={<Video className="w-5 h-5" />}
            status={productionLines.avatar_video.status}
            onGenerate={() => startProduction('avatar_video')}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-900/10"
            border="border-blue-100 dark:border-blue-900/20"
          />
          <ProductionCard 
            type="viral_video" 
            title="Viral AI Video" 
            icon={<Film className="w-5 h-5" />}
            status={productionLines.viral_video.status}
            onGenerate={() => startProduction('viral_video')}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-50 dark:bg-purple-900/10"
            border="border-purple-100 dark:border-purple-900/20"
          />
          <ProductionCard 
            type="carousel" 
            title="Carousel" 
            icon={<Images className="w-5 h-5" />}
            status={productionLines.carousel.status}
            onGenerate={() => startProduction('carousel')}
            color="text-pink-600 dark:text-pink-400"
            bg="bg-pink-50 dark:bg-pink-900/10"
            border="border-pink-100 dark:border-pink-900/20"
          />
          <ProductionCard 
            type="threads" 
            title="Threads Thread" 
            icon={<Type className="w-5 h-5" />}
            status={productionLines.threads.status}
            onGenerate={() => startProduction('threads')}
            color="text-foreground"
            bg="bg-gray-50 dark:bg-gray-800/30"
            border="border-gray-200 dark:border-gray-700"
          />
          <ProductionCard 
            type="seo_blog" 
            title="SEO Blog Post" 
            icon={<FileText className="w-5 h-5" />}
            status={productionLines.seo_blog.status}
            onGenerate={() => startProduction('seo_blog')}
            color="text-green-600 dark:text-green-400"
            bg="bg-green-50 dark:bg-green-900/10"
            border="border-green-100 dark:border-green-900/20"
          />
          <ProductionCard 
            type="tg_post" 
            title="Telegram Post" 
            icon={<Send className="w-5 h-5" />}
            status={productionLines.tg_post.status}
            onGenerate={() => startProduction('tg_post')}
            color="text-sky-500 dark:text-sky-400"
            bg="bg-sky-50 dark:bg-sky-900/10"
            border="border-sky-100 dark:border-sky-900/20"
          />
        </div>
      </ScrollArea>
    </div>
  );
};

interface ProductionCardProps {
  type: string;
  title: string;
  icon: React.ReactNode;
  status: string;
  onGenerate: () => void;
  color: string;
  bg?: string;
  border?: string;
}

const ProductionCard = ({ type, title, icon, status, onGenerate, color, bg, border }: ProductionCardProps) => {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className={`p-5 border-b flex items-center justify-between ${bg || 'bg-muted/30'} ${border || 'border-border'}`}>
        <div className={`flex items-center gap-3 font-bold ${color}`}>
          <div className="p-2 bg-background rounded-md shadow-sm">
            {icon}
          </div>
          {title}
        </div>
        <StatusBadge status={status} />
      </div>
      
      <div className="p-6 min-h-[160px] flex flex-col items-center justify-center relative">
        {status === 'idle' && (
          <div className="text-center w-full">
            <p className="text-sm text-muted-foreground mb-4">Контент не создан</p>
            <Button onClick={onGenerate} className="gap-2 w-full bg-primary/90 hover:bg-primary transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" />
              Сгенерировать
            </Button>
          </div>
        )}

        {status === 'generating' && (
          <div className="text-center space-y-4 w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <RefreshCw className="w-10 h-10 animate-spin text-primary relative z-10 mx-auto" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground animate-pulse">Генерация контента...</p>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        )}

        {status === 'review' && (
          <div className="w-full space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border border-border border-dashed h-24 flex flex-col items-center justify-center gap-2">
              <Eye className="w-5 h-5 opacity-50" />
              <span>Предпросмотр доступен</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button size="sm" variant="outline" className="w-full">Правки</Button>
              <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white w-full">
                <Check className="w-4 h-4" />
                Ок
              </Button>
            </div>
          </div>
        )}

        {status === 'ready' && (
           <div className="w-full relative group/content">
             <div className="flex flex-col items-center text-green-600 dark:text-green-400 gap-3 p-5 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-inner">
                  <Check className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold">Готово к публикации</span>
             </div>
             
             {/* Hover Actions */}
             <div className="absolute inset-0 bg-card/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/content:opacity-100 transition-opacity gap-2 rounded-xl border border-border">
                <Button size="sm" variant="default" className="shadow-lg">
                  <Eye className="w-4 h-4 mr-2" />
                  Смотреть
                </Button>
                <Button size="sm" variant="outline" onClick={onGenerate} title="Перегенерировать">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
           </div>
        )}
      </div>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'idle':
      return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">Ожидание</span>;
    case 'generating':
      return <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full animate-pulse border border-blue-100 dark:border-blue-900/50">В работе</span>;
    case 'review':
      return <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/50">Проверка</span>;
    case 'ready': // Using 'ready' as the success state based on store types usually
      return <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/50">Утверждено</span>;
    default:
      return null;
  }
};