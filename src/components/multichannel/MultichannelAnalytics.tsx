import { useState } from 'react';
import { 
  Layers, 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  GitBranch,
  Settings2,
  ArrowRight,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMultichannelAnalytics } from '@/hooks/useMultichannelAnalytics';
import { AttributionModelSelector } from './AttributionModelSelector';
import { AttributionTable } from './AttributionTable';
import { CustomerJourneyChart } from './CustomerJourneyChart';
import { CustomModelSettings } from './CustomModelSettings';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MultichannelAnalyticsProps {
  projectId: string | null;
}

const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + 'M ₸';
  if (rounded >= 1000) return Math.round(rounded / 1000) + 'K ₸';
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

export const MultichannelAnalytics = ({ projectId }: MultichannelAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState('channels');
  const [showCustomSettings, setShowCustomSettings] = useState(false);
  
  const {
    loading,
    attributionResults,
    comparisonResults,
    customerJourneys,
    summaryStats,
    selectedModel,
    setSelectedModel,
    compareModel,
    setCompareModel,
    customSettings,
    setCustomSettings,
  } = useMultichannelAnalytics(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background border rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
              <h2 className="text-lg sm:text-2xl font-bold">Мультиканальная аналитика</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Анализируйте путь клиента от первого касания до покупки.
            </p>
          </div>
          <Badge variant="outline" className="text-indigo-500 border-indigo-500/30 text-xs self-start">
            {summaryStats.avgTouchpoints.toFixed(1)} касаний
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <div className="bg-card border rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-sm text-muted-foreground">Визиты</span>
          </div>
          <p className="text-base sm:text-xl font-bold truncate">{formatNumber(summaryStats.totalVisits)}</p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-sm text-muted-foreground">Лиды</span>
          </div>
          <p className="text-base sm:text-xl font-bold truncate">{formatNumber(summaryStats.totalLeads)}</p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-sm text-muted-foreground">Продажи</span>
          </div>
          <p className="text-base sm:text-xl font-bold truncate">{formatNumber(summaryStats.totalSales)}</p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-sm text-muted-foreground">Выручка</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-success truncate">{formatCurrency(summaryStats.totalRevenue)}</p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <GitBranch className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-[10px] sm:text-sm text-muted-foreground">Касаний</span>
          </div>
          <p className="text-base sm:text-xl font-bold truncate">{summaryStats.avgTouchpoints.toFixed(1)}</p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
            <span className="text-[10px] sm:text-sm text-muted-foreground">Топ</span>
          </div>
          <p className="text-sm sm:text-base font-bold truncate">{summaryStats.topChannel}</p>
        </div>
      </div>

      {/* Model Selector */}
      <div className="bg-card border rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm sm:text-base">Модель атрибуции</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>Модель атрибуции определяет, как распределяется ценность конверсии между каналами</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {selectedModel === 'custom' && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowCustomSettings(!showCustomSettings)}
            >
              <Settings2 className="w-3 h-3 mr-1.5" />
              Настройки
            </Button>
          )}
        </div>

        <AttributionModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          compareModel={compareModel}
          onCompareModelChange={setCompareModel}
        />

        {showCustomSettings && selectedModel === 'custom' && (
          <CustomModelSettings
            settings={customSettings}
            onChange={setCustomSettings}
          />
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="channels">По каналам</TabsTrigger>
          <TabsTrigger value="campaigns">По кампаниям</TabsTrigger>
          <TabsTrigger value="journey">Путь клиента</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          <AttributionTable
            data={attributionResults}
            compareData={comparisonResults}
            selectedModel={selectedModel}
            compareModel={compareModel}
            groupBy="channel"
          />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <AttributionTable
            data={attributionResults}
            compareData={comparisonResults}
            selectedModel={selectedModel}
            compareModel={compareModel}
            groupBy="campaign"
          />
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          <CustomerJourneyChart journeys={customerJourneys} />
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-500/5 via-purple-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Подключите источники данных</h4>
              <p className="text-sm text-muted-foreground max-w-lg">
                Интегрируйте Google Analytics, Яндекс.Метрику и CRM для автоматического сбора данных о визитах и конверсиях
              </p>
            </div>
          </div>
          <Button>
            Настроить интеграции <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
