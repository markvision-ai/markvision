import React from 'react';
import { useFactoryStore, ContentType } from './store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Выберите сценарий из списка слева,<br/>чтобы начать производство</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-10">
        <div>
          <h2 className="text-lg font-semibold truncate max-w-md">{activeScript.title}</h2>
          <p className="text-xs text-slate-500">Центр Генерации</p>
        </div>
        <Button 
          onClick={approveAllToPosting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
        >
          <Send className="w-4 h-4 mr-2" />
          Утвердить всё
        </Button>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 p-6 bg-slate-50/50">
        <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto pb-10">
          <ProductionCard 
            type="avatar_video" 
            title="Avatar Video" 
            icon={<Video className="w-5 h-5" />}
            status={productionLines.avatar_video.status}
            onGenerate={() => startProduction('avatar_video')}
            color="text-blue-600"
          />
          <ProductionCard 
            type="viral_video" 
            title="Viral AI Video" 
            icon={<Film className="w-5 h-5" />}
            status={productionLines.viral_video.status}
            onGenerate={() => startProduction('viral_video')}
            color="text-purple-600"
          />
          <ProductionCard 
            type="carousel" 
            title="Carousel" 
            icon={<Images className="w-5 h-5" />}
            status={productionLines.carousel.status}
            onGenerate={() => startProduction('carousel')}
            color="text-pink-600"
          />
          <ProductionCard 
            type="threads" 
            title="Threads Thread" 
            icon={<Type className="w-5 h-5" />}
            status={productionLines.threads.status}
            onGenerate={() => startProduction('threads')}
            color="text-black"
          />
          <ProductionCard 
            type="seo_blog" 
            title="SEO Blog Post" 
            icon={<FileText className="w-5 h-5" />}
            status={productionLines.seo_blog.status}
            onGenerate={() => startProduction('seo_blog')}
            color="text-green-600"
          />
          <ProductionCard 
            type="tg_post" 
            title="Telegram Post" 
            icon={<Send className="w-5 h-5" />}
            status={productionLines.tg_post.status}
            onGenerate={() => startProduction('tg_post')}
            color="text-sky-500"
          />
        </div>
      </ScrollArea>
    </div>
  );
};

const ProductionCard = ({ 
  type, 
  title, 
  icon, 
  status, 
  onGenerate,
  color 
}: { 
  type: string; 
  title: string; 
  icon: React.ReactNode; 
  status: string; 
  onGenerate: () => void;
  color: string;
}) => {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 flex flex-col h-full min-h-[200px]">
        <div className="flex justify-between items-start mb-4">
          <div className={`flex items-center gap-2 font-medium ${color}`}>
            {icon}
            {title}
          </div>
          {status === 'ready' && <div className="w-2 h-2 rounded-full bg-green-500" />}
          {status === 'generating' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
        </div>

        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 mb-4 relative overflow-hidden group">
          {status === 'idle' && (
            <p className="text-xs text-slate-400">Ожидание генерации</p>
          )}
          
          {status === 'generating' && (
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-indigo-600 font-medium">Создаем контент...</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="text-center">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-xs text-green-600 font-medium">Готово к публикации</p>
              </div>
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <Button size="sm" variant="secondary">
                  <Eye className="w-4 h-4 mr-2" />
                  Смотреть
                </Button>
                <Button size="sm" variant="outline" className="bg-transparent text-white hover:bg-white/20 border-white/50" onClick={onGenerate}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          {status === 'idle' ? (
            <Button size="sm" onClick={onGenerate} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Генерировать
            </Button>
          ) : status === 'ready' ? (
             <Button size="sm" variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50">
              <Check className="w-4 h-4 mr-2" />
              Утверждено
            </Button>
          ) : (
            <Button size="sm" disabled className="w-full">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              В работе...
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
