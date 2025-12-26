import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { KanbanBoard } from './KanbanBoard';
import { CRMFunnel } from './CRMFunnel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Kanban, TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';

interface CRMPageProps {
  projectId: string | null;
}

const tabs = ['kanban', 'funnel'] as const;
type TabValue = typeof tabs[number];

export const CRMPage = ({ projectId }: CRMPageProps) => {
  const { leads, loading, refetch } = useLeads(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('kanban');
  const [direction, setDirection] = useState(0);
  const isMobile = useIsMobile();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const currentIndex = tabs.indexOf(activeTab);
    
    if (info.offset.x < -swipeThreshold && currentIndex < tabs.length - 1) {
      setDirection(1);
      setActiveTab(tabs[currentIndex + 1]);
    } else if (info.offset.x > swipeThreshold && currentIndex > 0) {
      setDirection(-1);
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleTabChange = (value: string) => {
    const newIndex = tabs.indexOf(value as TabValue);
    const currentIndex = tabs.indexOf(activeTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(value as TabValue);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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

        {/* Swipeable content for mobile with pull-to-refresh */}
        <div className="mt-4 overflow-hidden">
          {isMobile ? (
            <PullToRefresh onRefresh={handleRefresh}>
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleSwipe}
                className="touch-pan-y"
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={activeTab}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
                  >
                    {activeTab === 'kanban' ? (
                      <KanbanBoard 
                        leads={leads} 
                        loading={loading} 
                        onRefetch={refetch}
                        projectId={projectId}
                      />
                    ) : (
                      <CRMFunnel leads={leads} loading={loading} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </PullToRefresh>
          ) : (
            <>
              {activeTab === 'kanban' ? (
                <KanbanBoard 
                  leads={leads} 
                  loading={loading} 
                  onRefetch={refetch}
                  projectId={projectId}
                />
              ) : (
                <CRMFunnel leads={leads} loading={loading} />
              )}
            </>
          )}
        </div>

        {/* Swipe indicator for mobile */}
        {isMobile && (
          <div className="flex justify-center gap-1.5 mt-3">
            {tabs.map((tab) => (
              <div
                key={tab}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  activeTab === tab ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </Tabs>
    </div>
  );
};
