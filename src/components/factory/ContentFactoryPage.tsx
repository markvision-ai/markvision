import React, { useState, useEffect } from 'react';
import { useContentFactory } from '@/hooks/useContentFactory';
import { FactoryBriefing } from './FactoryBriefing';
import { FactoryWorkArea } from './FactoryWorkArea';
import { FactoryDispatch } from './FactoryDispatch';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Eye, Sparkles } from 'lucide-react';
import { CreateContentDialog } from './CreateContentDialog';
import { CompetitorMonitoring } from './CompetitorMonitoring';
import { ContentAnalysisByLink } from './ContentAnalysisByLink';

interface ContentFactoryPageProps {
  projectId?: string | null;
}

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

// Mock Data for Briefing (Dental Implants Focus)
const MOCK_IDEAS = [
  { id: '1', title: 'Мифы об имплантации зубов: больно ли это?', source: 'Dr. Smile', url: '#', views: '150K' },
  { id: '2', title: 'Как выбрать систему имплантов: Straumann vs Osstem', source: 'Stomatology Guide', url: '#', views: '89K' },
  { id: '3', title: 'Одномоментная имплантация: зубы за 1 день', source: 'Implant Pro', url: '#', views: '210K' },
  { id: '4', title: 'Срок службы имплантов: на всю жизнь или нет?', source: 'Dental Facts', url: '#', views: '95K' },
  { id: '5', title: 'Противопоказания к имплантации: кому нельзя?', source: 'Health Teeth', url: '#', views: '78K' },
  { id: '6', title: 'Этапы установки импланта: пошаговый разбор', source: 'Med Education', url: '#', views: '120K' },
  { id: '7', title: 'Костная пластика: зачем она нужна и как избежать', source: 'Bone Expert', url: '#', views: '65K' },
  { id: '8', title: 'Имплантация All-on-4: решение при полной адентии', source: 'Smile Restore', url: '#', views: '300K' },
  { id: '9', title: 'Почему импланты лучше мостовидных протезов?', source: 'Ortho Daily', url: '#', views: '110K' },
  { id: '10', title: 'Уход за имплантами: 5 золотых правил', source: 'Hygiene Tips', url: '#', views: '55K' },
  { id: '11', title: 'Осложнения после имплантации: как предотвратить', source: 'Safety First', url: '#', views: '92K' },
  { id: '12', title: 'Имплантация при сахарном диабете: это возможно?', source: 'Med Science', url: '#', views: '45K' },
  { id: '13', title: 'Стоимость имплантации под ключ: из чего складывается цена', source: 'Market Watch', url: '#', views: '180K' },
  { id: '14', title: 'Гарантия на импланты: что нужно знать пациенту', source: 'Legal Med', url: '#', views: '70K' },
  { id: '15', title: 'Синус-лифтинг: страшная операция или рутина?', source: 'Surgery Blog', url: '#', views: '88K' },
  { id: '16', title: 'Имплантация во сне: седация и наркоз', source: 'Sleep Dent', url: '#', views: '130K' },
  { id: '17', title: 'Как подготовиться к операции по установке импланта', source: 'Patient Guide', url: '#', views: '60K' },
  { id: '18', title: 'Можно ли ставить импланты курильщикам?', source: 'Health Risks', url: '#', views: '105K' },
  { id: '19', title: 'Восстановление после имплантации: первые 3 дня', source: 'Recovery Tips', url: '#', views: '145K' },
  { id: '20', title: 'Эстетика на имплантах: десневая пластика', source: 'Aesthetic Dent', url: '#', views: '98K' },
];

export const ContentFactoryPage = ({ projectId: propProjectId }: ContentFactoryPageProps) => {
  const projectId = propProjectId || TARGET_PROJECT_ID;
  const { createContent } = useContentFactory(projectId);
  
  // State
  const [activeTab, setActiveTab] = useState('factory');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Factory State
  const [selectedIdea, setSelectedIdea] = useState<any>(MOCK_IDEAS[0]);
  const [script, setScript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [productionStatus, setProductionStatus] = useState({
    avatar: 0,
    viral: 0,
    carousel: 0,
    threads: 0,
    telegram: 0,
    article: 0
  });

  // Effect: When idea selected, set script template
  useEffect(() => {
    if (selectedIdea) {
      setScript(
`# МАСТЕР-СЦЕНАРИЙ: ${selectedIdea.title}

[HOOK - 3 СЕКУНДЫ]
(Визуальный триггер: Крупный план врача или 3D-модель зуба)
"Внимание! Если вы думаете об имплантации, вы обязаны знать этот факт про ${selectedIdea.title.split(':')[0]}!"

[ПРОБЛЕМА - 10 СЕКУНД]
Многие пациенты откладывают визит, потому что боятся боли или высоких цен. Но знаете ли вы, что игнорирование проблемы ведет к атрофии кости?

[РЕШЕНИЕ - 30 СЕКУНД]
Современные технологии позволяют решить вопрос быстро и безболезненно.
1. Цифровое сканирование вместо слепков.
2. 3D-моделирование будущей улыбки.
3. Гарантия приживаемости 99%.

[CTA - ПРИЗЫВ]
Не ждите, пока станет поздно. Напишите "УЛЫБКА" в директ, и мы пришлем вам план лечения и расчет стоимости.

#имплантация #стоматолог #здоровье #красиваяулыбка`);
      // Reset production
      setProductionStatus({ avatar: 0, viral: 0, carousel: 0, threads: 0, telegram: 0, article: 0 });
      setIsProcessing(false);
    }
  }, [selectedIdea]);

  const handleStartFactory = () => {
    if (!script.trim()) {
      toast.error("Script is empty. Cannot start production.");
      return;
    }

    setIsProcessing(true);
    toast.success("FACTORY STARTED: Initializing Production Lines...");

    // Simulate Production Process
    const interval = setInterval(() => {
      setProductionStatus(prev => {
        const newState = {
          avatar: Math.min(prev.avatar + Math.random() * 5, 100),
          viral: Math.min(prev.viral + Math.random() * 3, 100),
          carousel: Math.min(prev.carousel + Math.random() * 8, 100),
          threads: Math.min(prev.threads + Math.random() * 6, 100),
          telegram: Math.min(prev.telegram + Math.random() * 7, 100),
          article: Math.min(prev.article + Math.random() * 10, 100),
        };

        if (newState.avatar >= 100 && newState.viral >= 100 && newState.carousel >= 100 && newState.threads >= 100 && newState.telegram >= 100 && newState.article >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          toast.success("PRODUCTION COMPLETE: All assets ready for dispatch.");
        }
        return newState;
      });
    }, 200);
  };

  const handleManualSend = () => {
    toast.success("Sent to Telegram Bot for manual review.");
  };

  const handleAutoStart = () => {
    toast.success("Autopilot Engaged: Publishing to YT, Threads, and Web.");
  };

  const isReady = !isProcessing && Object.values(productionStatus).every(v => v === 100);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden font-sans">
      
      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl">
          <TabsList className="bg-slate-100 border border-slate-200">
            <TabsTrigger value="factory" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Конвейер
            </TabsTrigger>
            <TabsTrigger value="competitors" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500">
              <Eye className="w-4 h-4 mr-2" />
              Мониторинг конкурентов
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500">
              <Sparkles className="w-4 h-4 mr-2" />
              Анализ по ссылке
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать контент
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Factory Tab Content */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === 'factory' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden">
             {/* 1. TOP PANEL: BRIEFING */}
            <FactoryBriefing 
              ideas={MOCK_IDEAS} 
              onSelectIdea={setSelectedIdea} 
              selectedIdeaId={selectedIdea?.id} 
            />

            {/* 2. CENTRAL ZONE: WORK AREA */}
            <FactoryWorkArea 
              script={script} 
              onScriptChange={setScript}
              isProcessing={isProcessing}
              onStartFactory={handleStartFactory}
              productionStatus={productionStatus}
            />

            {/* 3. BOTTOM ZONE: DISPATCH */}
            <FactoryDispatch 
              onManualSend={handleManualSend}
              onAutoStart={handleAutoStart}
              isReady={isReady}
            />
          </div>
        </div>

        {/* Competitors Tab Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'competitors' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <CompetitorMonitoring projectId={projectId} />
        </div>

        {/* Analysis Tab Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'analysis' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <ContentAnalysisByLink projectId={projectId} />
        </div>

      </div>

      <CreateContentDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onCreate={createContent}
      />
    </div>
  );
};
