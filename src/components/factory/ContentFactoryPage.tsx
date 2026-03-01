import { useState, useEffect } from 'react';
import { useContentFactory } from '@/hooks/useContentFactory';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Sparkles, Rocket } from 'lucide-react';
import { CreateContentDialog } from './CreateContentDialog';
import { CompetitorMonitoring } from './CompetitorMonitoring';
import { ContentAnalysisByLink } from './ContentAnalysisByLink';
import { UnifiedContentFactory } from './UnifiedContentFactory';

interface ContentFactoryPageProps {
  projectId?: string | null;
}

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const ContentFactoryPage = ({ projectId: propProjectId }: ContentFactoryPageProps) => {
  const projectId = propProjectId || TARGET_PROJECT_ID;
  const { createContent } = useContentFactory(projectId);

  // State
  const [activeTab, setActiveTab] = useState('v4');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden font-sans bg-[#020617]">

      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-8 py-6 bg-transparent absolute top-0 w-full z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl">
          <TabsList className="bg-card/40 backdrop-blur-3xl border border-white/10 shadow-interstellar rounded-full p-1.5 h-auto">
            <TabsTrigger value="v4" className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:text-white text-white/40 transition-all font-black uppercase tracking-widest text-[10px] gap-2">
              <Rocket className="w-4 h-4" />
              Контент-Завод
            </TabsTrigger>
            <TabsTrigger value="competitors" className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:text-white text-white/40 transition-all font-black uppercase tracking-widest text-[10px] gap-2">
              <Eye className="w-4 h-4" />
              Мониторинг
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-full px-8 py-3 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:text-white text-white/40 transition-all font-black uppercase tracking-widest text-[10px] gap-2">
              <Sparkles className="w-4 h-4" />
              Анализ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          variant="default"
          className="rounded-full h-12 px-8 bg-secondary hover:bg-secondary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-interstellar border-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать контент
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">

        {/* Content Factory V4 Tab Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'v4' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'} overflow-y-auto`}>
          <UnifiedContentFactory projectId={projectId} />
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
// Forced rebuild
