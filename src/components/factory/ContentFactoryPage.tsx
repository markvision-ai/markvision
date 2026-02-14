import { useState, useEffect } from 'react';
import { useContentFactory } from '@/hooks/useContentFactory';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Sparkles, Rocket } from 'lucide-react';
import { CreateContentDialog } from './CreateContentDialog';
import { CompetitorMonitoring } from './CompetitorMonitoring';
import { ContentAnalysisByLink } from './ContentAnalysisByLink';
import { ContentFactoryWizard } from './wizard/ContentFactoryWizard';

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
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden font-sans">

      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="v4" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
              <Rocket className="w-4 h-4 mr-2" />
              Контент-Завод
            </TabsTrigger>
            <TabsTrigger value="competitors" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
              <Eye className="w-4 h-4 mr-2" />
              Мониторинг конкурентов
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
              <Sparkles className="w-4 h-4 mr-2" />
              Анализ по ссылке
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          variant="default"
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать контент
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">

        {/* Content Factory V4 Tab Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'v4' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <ContentFactoryWizard />
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
