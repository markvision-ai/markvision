import React, { useState } from 'react';
import { useContentFactory } from '@/hooks/useContentFactory';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Sparkles, Rocket } from 'lucide-react';
import { CreateContentDialog } from './CreateContentDialog';
import { CompetitorMonitoring } from './CompetitorMonitoring';
import { ContentAnalysisByLink } from './ContentAnalysisByLink';
import { ContentFactoryV4 } from './v4/ContentFactoryV4';

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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden font-sans">
      
      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="v4" className="data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-white text-white/60">
              <Rocket className="w-4 h-4 mr-2" />
              Контент-Завод
            </TabsTrigger>
            <TabsTrigger value="competitors" className="data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-white text-white/60">
              <Eye className="w-4 h-4 mr-2" />
              Мониторинг конкурентов
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-white text-white/60">
              <Sparkles className="w-4 h-4 mr-2" />
              Анализ по ссылке
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать контент
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Content Factory V4 Tab Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'v4' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <ContentFactoryV4 />
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
