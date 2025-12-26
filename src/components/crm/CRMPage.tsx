import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { KanbanBoard } from './KanbanBoard';
import { CRMFunnel } from './CRMFunnel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Kanban, TrendingUp } from 'lucide-react';

interface CRMPageProps {
  projectId: string | null;
}

export const CRMPage = ({ projectId }: CRMPageProps) => {
  const { leads, loading, refetch } = useLeads(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold truncate">CRM</h2>
          <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">
            Управление лидами и сделками
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="ml-2 hidden sm:inline">Обновить</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="kanban" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Kanban className="w-4 h-4" />
            <span>Канбан</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Воронка</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard 
            leads={leads} 
            loading={loading} 
            onRefetch={refetch}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="funnel" className="mt-4">
          <CRMFunnel leads={leads} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
