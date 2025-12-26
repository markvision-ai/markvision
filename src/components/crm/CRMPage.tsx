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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM</h2>
          <p className="text-muted-foreground text-sm">
            Управление лидами и сделками
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <Kanban className="w-4 h-4" />
            Канбан
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Воронка
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
