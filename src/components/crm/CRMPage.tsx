import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { KanbanBoard } from './KanbanBoard';
import { CRMFunnel } from './CRMFunnel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Kanban, TrendingUp, Sparkles } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Premium Header */}
      <motion.div 
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg crm-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold crm-header-gradient">
                CRM
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">
                Управление лидами и сделками
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex-shrink-0 crm-card-glass border-primary/20 hover:border-primary/50 hover:crm-glow transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="ml-2 hidden sm:inline">Обновить</span>
        </Button>
      </motion.div>

      {/* Premium Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex crm-card-glass p-1 gap-1">
            <TabsTrigger 
              value="kanban" 
              className="gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Kanban className="w-4 h-4" />
              <span>Канбан</span>
            </TabsTrigger>
            <TabsTrigger 
              value="funnel" 
              className="gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/80 data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Воронка</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Swipeable content for mobile with pull-to-refresh */}
        <div className="mt-6 overflow-hidden">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
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
          )}
        </div>

        {/* Premium Swipe indicator for mobile */}
        {isMobile && (
          <div className="flex justify-center gap-2 mt-4">
            {tabs.map((tab) => (
              <motion.div
                key={tab}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeTab === tab 
                    ? 'w-6 bg-gradient-to-r from-primary to-accent' 
                    : 'w-1.5 bg-muted-foreground/30'
                }`}
                layoutId="tabIndicator"
              />
            ))}
          </div>
        )}
      </Tabs>
    </div>
  );
};
