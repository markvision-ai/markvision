import { useState } from 'react';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { FileText, Users, Building, TrendingUp, ClipboardCheck, Loader2, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
      <div className="bg-white/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[32px] p-8 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-[20px] bg-slate-50 border border-slate-100 shadow-sm">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Типы визитов</h2>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest text-[10px] opacity-60">Выберите тип анкеты для отправки клиенту</p>
          </div>
        </div>

        <HoverEffect items={hoverItems} />
      </div>

      {/* Results Table */}
      <Card className="bg-white/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[32px] overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <span className="opacity-40">📊</span> Результаты визитов
          </h3>
        </div>

        {!visitResults || visitResults.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ClipboardCheck className="w-10 h-10 text-slate-200" />
            </div>
            <h4 className="text-foreground font-black uppercase tracking-tight mb-2 opacity-60">Нет результатов визитов</h4>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-black opacity-40 max-w-[280px] mx-auto">
              Данные появятся здесь после прохождения визитов клиентами
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Клиент</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Тип визита</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Дата завершения</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Сумма сделки</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Статус</th>
                </tr>
              </thead>
              <tbody>
                {visitResults.map((result: any) => {
                  const lead = result.lead || result;
                  const statusConfig = getStatusConfig(lead.status);

                  return (
                    <tr key={result.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-5 px-6 font-black text-sm text-foreground uppercase tracking-tighter">
                        {lead.name || lead.phone || <span className="opacity-30">БЕЗ ИМЕНИ</span>}
                      </td>
                      <td className="py-5 px-6">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 text-muted-foreground px-2 py-0.5 rounded-md">
                          {result.visit_type || 'СТАНДАРТ'}
                        </Badge>
                      </td>
                      <td className="py-5 px-6 text-xs font-bold text-muted-foreground">
                        {new Date(result.created_at || lead.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-5 px-6 font-black text-sm text-foreground">
                        {lead.deal_amount ? `${Math.round(lead.deal_amount).toLocaleString('ru-RU')} ₸` : <span className="opacity-20">—</span>}
                      </td>
                      <td className="py-5 px-6">
                        <Badge className={`gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border-0 ${statusConfig.className}`}>
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
      </Card>

      {/* Type Details Dialog */}
      <Dialog open={!!selectedType} onOpenChange={() => setSelectedType(null)}>
        <DialogContent className="max-w-lg border-white/80 bg-white/95 backdrop-blur-3xl shadow-2xl rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">
              {visitTypes.find(t => t.id === selectedType)?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <p className="text-muted-foreground font-medium leading-relaxed">
              {visitTypes.find(t => t.id === selectedType)?.description}
            </p>
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-4 items-start">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-blue-800/80 leading-snug">
                Ссылка для клиента будет сгенерирована автоматически при создании лида в CRM и отправлена выбранным способом связи.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setSelectedType(null)} className="flex-1 rounded-2xl py-6 font-bold border-slate-200">
              Закрыть
            </Button>
            <Button className="flex-1 rounded-2xl py-6 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              Создать анкету
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
