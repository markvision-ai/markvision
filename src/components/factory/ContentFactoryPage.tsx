import { useState, useEffect } from 'react';
import { useContentFactory } from '@/hooks/useContentFactory';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Sparkles, Rocket, RefreshCw } from 'lucide-react';
import { CreateContentDialog } from './CreateContentDialog';
import { CompetitorMonitoring } from './CompetitorMonitoring';
import { ContentAnalysisByLink } from './ContentAnalysisByLink';
import { ContentFactoryWizard } from './wizard/ContentFactoryWizard';
import { CompetitorsPage } from '../competitors/CompetitorsPage';

interface ContentFactoryPageProps {
  projectId?: string | null;
}

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const ContentFactoryPage = ({ projectId: propProjectId }: ContentFactoryPageProps) => {
  const projectId = propProjectId || TARGET_PROJECT_ID;
  const { createContent } = useContentFactory(projectId);
  // State
  const [activeTab, setActiveTab] = useState('wizard');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden font-sans">

      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 interstellar-glass">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="wizard" className="data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-white text-white/60">
              <Rocket className="w-4 h-4 mr-2" />
              Мастерская контента
            </TabsTrigger>
            <TabsTrigger value="competitors" className="data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-white text-white/60">
              <Eye className="w-4 h-4 mr-2" />
              Мониторинг
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-white text-white/60">
              <Sparkles className="w-4 h-4 mr-2" />
              Анализ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="hidden" // Hiding old create button as wizard handles it
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать контент
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">

        {/* New Wizard Tab Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'wizard' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <ContentFactoryWizard />
        </div>

        {/* Competitors Tab Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'competitors' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <CompetitorsPage projectId={projectId} />
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
