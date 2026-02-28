import { useState } from 'react';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { FileText, Users, Building, TrendingUp, ClipboardCheck, Loader2, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface VisitsPageProps {
  projectId: string | null;
}

const visitTypes = [
  {
    id: 'marketing-audit',
    title: 'Маркетинг-аудит',
    description: 'Полный анализ маркетинговых процессов и каналов привлечения клиентов',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: 'sales-audit',
    title: 'Аудит продаж',
    description: 'Оценка воронки продаж, скриптов и конверсии менеджеров',
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 'business-health',
    title: 'Здоровье бизнеса',
    description: 'Комплексный анализ финансов, процессов и команды',
    icon: <Building className="w-6 h-6" />,
  },
  {
    id: 'express-check',
    title: 'Экспресс-проверка',
    description: 'Быстрая оценка ключевых показателей за 15 минут',
    icon: <ClipboardCheck className="w-6 h-6" />,
  },
];

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case 'paid':
      return { label: 'Оплачено', icon: <DollarSign className="w-4 h-4" />, className: 'bg-green-500/20 text-green-500' };
    case 'cancelled':
      return { label: 'Отказ', icon: <XCircle className="w-4 h-4" />, className: 'bg-red-500/20 text-red-500' };
    case 'appointment':
      return { label: 'Записан на визит', icon: <Calendar className="w-4 h-4" />, className: 'bg-blue-500/20 text-blue-500' };
    case 'visit_completed':
      return { label: 'Визит пройден', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-purple-500/20 text-purple-500' };
    default:
      return { label: 'В обработке', icon: <ClipboardCheck className="w-4 h-4" />, className: 'bg-yellow-500/20 text-yellow-500' };
  }
};

export const VisitsPage = ({ projectId }: VisitsPageProps) => {
  const pid = projectId ?? null;
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const { data: visitResults, isLoading } = useQuery({
    queryKey: ['visit-results', pid],
    queryFn: async () => {
      if (!pid) return [];
      
      // First try to get from visit_results table
      const { data: visitResultsData, error: visitError } = await (supabase as any)
        .from('visit_results')
        .select(`
          *,
          lead:leads(id, name, phone, status, deal_amount)
        `)
        .eq('project_id', pid)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!visitError && visitResultsData && visitResultsData.length > 0) {
        return visitResultsData;
      }
      
      // Fallback to leads with diagnostic-related statuses
      const { data: leads, error: leadsError } = await (supabase as any)
        .from('leads')
        .select('*')
        .eq('project_id', pid)
        .in('status', ['appointment', 'visit_completed', 'paid', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (leadsError) throw leadsError;
      return (leads || []).map(lead => ({
        id: lead.id,
        lead_id: lead.id,
        lead: lead,
        result: lead.status,
        completed_at: lead.updated_at,
        created_at: lead.created_at,
      }));
    },
    enabled: !!pid,
  });

  const hoverItems = visitTypes.map((type) => ({
    ...type,
    onClick: () => setSelectedType(type.id),
  }));

  if (!pid) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground">
        Выберите проект, чтобы открыть раздел визитов.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Visit Types Selection */}
      <div className="bg-card border border-white/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Типы визитов</h2>
            <p className="text-muted-foreground text-sm">Выберите тип анкеты для отправки клиенту</p>
          </div>
        </div>
        
        <HoverEffect items={hoverItems} />
      </div>

      {/* Results Table */}
      <div className="bg-card border border-white/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">📊 Результаты визитов</h3>
        
        {!visitResults || visitResults.length === 0 ? (
          <div className="bg-muted/30 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-foreground font-medium mb-2">Нет результатов визитов</h4>
            <p className="text-muted-foreground text-sm">
              Данные появятся здесь после прохождения визитов клиентами
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/50">
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Клиент</th>
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Тип</th>
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Дата</th>
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Сумма</th>
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {visitResults.map((result: any) => {
                  const lead = result.lead || result;
                  const statusConfig = getStatusConfig(lead.status);
                  
                  return (
                    <tr key={result.id} className="border-b border-white/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {lead.name || lead.phone || 'Без имени'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {result.visit_type || 'Визит'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(result.created_at || lead.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {lead.deal_amount ? `${Math.round(lead.deal_amount).toLocaleString('ru-RU')} ₸` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`gap-1 ${statusConfig.className}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Type Details Dialog */}
      <Dialog open={!!selectedType} onOpenChange={() => setSelectedType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {visitTypes.find(t => t.id === selectedType)?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground">
              {visitTypes.find(t => t.id === selectedType)?.description}
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-foreground/80">
                📎 Ссылка для клиента будет сгенерирована автоматически при создании лида в CRM.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSelectedType(null)} className="flex-1">
              Закрыть
            </Button>
            <Button className="flex-1">
              Создать анкету
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
