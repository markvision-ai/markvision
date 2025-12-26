import { useState } from 'react';
import { Campaign } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Bot, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AutopilotRulesPanel } from './AutopilotRulesPanel';

interface CampaignDrawerProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => Promise<boolean>;
}

// Mock data for the chart
const generateChartData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: format(date, 'd MMM', { locale: ru }),
      spent: Math.floor(Math.random() * 50000) + 10000,
      revenue: Math.floor(Math.random() * 100000) + 20000,
    });
  }
  return data;
};

export const CampaignDrawer = ({
  campaign,
  open,
  onClose,
  onUpdateCampaign,
}: CampaignDrawerProps) => {
  const chartData = generateChartData();

  if (!campaign) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              campaign.platform === 'facebook' ? 'bg-[#1877F2] text-white' :
              campaign.platform === 'tiktok' ? 'bg-foreground text-background' : 'bg-[#EA4335] text-white'
            }`}>
              {campaign.platform === 'facebook' ? 'f' : campaign.platform === 'tiktok' ? 'T' : 'G'}
            </div>
            {campaign.name}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Performance Chart */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Динамика за 7 дней</h3>
              <div className="h-[200px] bg-muted/20 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => 
                        new Intl.NumberFormat('ru-RU').format(value) + ' ₸'
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="spent"
                      name="Расход"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Доход"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <Separator />

            {/* Autopilot Rules - New Panel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-success" />
                <h3 className="text-sm font-medium">Правила Автопилота 2.0</h3>
              </div>
              <AutopilotRulesPanel 
                campaign={campaign} 
                onUpdateCampaign={onUpdateCampaign} 
              />
            </div>

            <Separator />

            {/* AI Log */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Лог действий AI</h3>
              </div>

              <div className="space-y-2">
                {campaign.ai_log && campaign.ai_log.length > 0 ? (
                  campaign.ai_log.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'dd.MM HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm">{log.action}</p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground bg-muted/20 rounded-lg">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Пока нет действий</p>
                    <p className="text-xs mt-1">
                      Включите AI Autopilot для автоматического управления
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
