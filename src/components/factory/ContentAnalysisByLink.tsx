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
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useContentFactory } from '@/hooks/useContentFactory';
import { supabase } from '@/integrations/supabase/client';

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
      toast.error(error.message || 'Не удалось проанализировать ссылку. Возможно, превышен лимит или сервис недоступен.');
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
    <div className="h-full flex flex-col p-8 space-y-10 overflow-y-auto bg-slate-50/50">
       {/* Header with animated gradient text */}
       <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full text-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3" />
          AI Content Analyst
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Анализ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Контента</span>
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl">
          Прикрепите ссылку на Reels или аккаунт и получите детальный разбор: хуки, триггеры, сценарий и причины виральности.
        </p>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <div className="flex gap-2 p-2 bg-white rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <div className="pl-3 flex items-center pointer-events-none text-slate-400">
            <LinkIcon className="w-5 h-5" />
          </div>
          <Input 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Вставьте ссылку на Reels, TikTok или пост..." 
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-lg h-12"
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !url.trim()}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md shadow-blue-200"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Анализирую...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Разобрать
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-center text-slate-400">
          Поддерживается: Instagram Reels, TikTok, YouTube Shorts
        </p>
      </div>

      {/* Result Section */}
      {result && (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Left Column: Core Analysis */}
            <div className="space-y-6">
              <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg text-blue-700">
                    <Target className="w-5 h-5 mr-2" />
                    Тема и Хук
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Тема</h4>
                    <p className="text-slate-900 font-medium">{result.topic}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Хук (Зацепка)</h4>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-sm mt-1">
                      {result.hook}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg text-purple-700">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Почему это залетело?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.virality_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Structure & Action */}
            <div className="space-y-6">
              <Card className="border-l-4 border-l-indigo-500 shadow-md h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg text-indigo-700">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Структура Сценария
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-3">
                    {result.script_structure.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700">{step}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Call to Action (CTA)</h4>
                    <div className="flex items-center gap-2 text-indigo-600 font-medium bg-indigo-50 px-3 py-2 rounded-lg">
                      <MessageCircle className="w-4 h-4" />
                      {result.cta}
                    </div>
                  </div>
                </CardContent>
                
                <div className="p-6 pt-0 mt-auto">
                  <Button 
                    onClick={handleCreateScenario} 
                    disabled={isCreating}
                    className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200/50 group"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Создаю...
                      </>
                    ) : (
                      <>
                        Создать сценарий
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-slate-400 mt-3">
                    Отправит структуру во входящий поток для генерации контента
                  </p>
                </div>
              </Card>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
