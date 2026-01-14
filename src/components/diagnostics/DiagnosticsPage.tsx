import { useState } from 'react';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { FileText, Users, Building, TrendingUp, ClipboardCheck, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface DiagnosticsPageProps {
  projectId: string | null;
}

const diagnosticTypes = [
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
    description: 'Комплексная диагностика финансов, процессов и команды',
    icon: <Building className="w-6 h-6" />,
  },
  {
    id: 'express-check',
    title: 'Экспресс-проверка',
    description: 'Быстрая оценка ключевых показателей за 15 минут',
    icon: <ClipboardCheck className="w-6 h-6" />,
  },
];

export const DiagnosticsPage = ({ projectId }: DiagnosticsPageProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const { data: leads, isLoading } = useQuery({
    queryKey: ['diagnostics-leads', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .not('extra_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const hoverItems = diagnosticTypes.map((type) => ({
    ...type,
    onClick: () => setSelectedType(type.id),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const diagnosticLeads = leads?.filter(lead => {
    const extra = lead.extra_data as Record<string, unknown> | null;
    return extra && (extra.diagnostic_type || extra.questionnaire_type);
  }) || [];

  return (
    <div className="space-y-8">
      {/* Diagnostic Types Selection */}
      <div className="bg-[#161B26] border border-neutral-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Типы диагностик</h2>
            <p className="text-neutral-400 text-sm">Выберите тип анкеты для отправки клиенту</p>
          </div>
        </div>
        
        <HoverEffect items={hoverItems} />
      </div>

      {/* Results Table */}
      <div className="bg-[#161B26] border border-neutral-800/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Результаты диагностик</h3>
        
        {diagnosticLeads.length === 0 ? (
          <div className="bg-neutral-800/30 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="text-white font-medium mb-2">Нет заполненных анкет</h4>
            <p className="text-neutral-400 text-sm">
              Данные диагностик появятся здесь после заполнения клиентами анкет
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-neutral-400 text-sm font-medium">Клиент</th>
                  <th className="text-left py-3 px-4 text-neutral-400 text-sm font-medium">Тип</th>
                  <th className="text-left py-3 px-4 text-neutral-400 text-sm font-medium">Дата</th>
                  <th className="text-left py-3 px-4 text-neutral-400 text-sm font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticLeads.map((lead) => {
                  const extra = lead.extra_data as Record<string, unknown> | null;
                  return (
                    <tr key={lead.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-4 text-white">{lead.name || lead.phone || 'Без имени'}</td>
                      <td className="py-3 px-4 text-neutral-400">
                        {String(extra?.diagnostic_type || extra?.questionnaire_type || 'Анкета')}
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                          Заполнено
                        </span>
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
        <DialogContent className="bg-[#161B26] border-neutral-700">
          <DialogHeader>
            <DialogTitle>
              {diagnosticTypes.find(t => t.id === selectedType)?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-neutral-400">
              {diagnosticTypes.find(t => t.id === selectedType)?.description}
            </p>
            <div className="bg-neutral-800/50 rounded-lg p-4">
              <p className="text-sm text-neutral-300">
                📎 Ссылка для клиента будет сгенерирована автоматически при создании лида в CRM.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSelectedType(null)} className="flex-1">
              Закрыть
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              Создать анкету
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
