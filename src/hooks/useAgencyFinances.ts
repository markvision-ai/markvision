// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgencyFinance {
  id?: string;
  project_id: string;
  project_name: string;
  tier: 'lite' | 'pro' | 'legacy';
  package_revenue: number;
  team_members: string;
  team_salaries: number;
  software_costs: number;
  other_expenses: number;
  payment_date?: string;
  yuri_net_profit?: number;
}

// Колонки которые точно есть в удалённой БД
const DB_COLUMNS = [
  'id',
  'project_id',
  'project_name',
  'tier',
  'package_revenue',
  'team_members',
  'team_salaries',
  'software_costs',
];

// Дополнительные колонки (могут отсутствовать)
const OPTIONAL_COLUMNS = ['other_expenses', 'payment_date'];

export const useAgencyFinances = () => {
  const [finances, setFinances] = useState<AgencyFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [hasOptionalColumns, setHasOptionalColumns] = useState<boolean | null>(null);

  // Загрузка данных ТОЛЬКО из agency_project_finances
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Пробуем загрузить все колонки
      let data: any[] | null = null;
      let optionalSupported = hasOptionalColumns;

      if (optionalSupported !== false) {
        // Первая попытка — все колонки
        const result = await supabase
          .from('agency_project_finances')
          .select('*');

        if (result.error) {
          // Если ошибка связана с колонками — пробуем без них
          if (result.error.code === 'PGRST204') {
            optionalSupported = false;
            setHasOptionalColumns(false);
          } else {
            throw result.error;
          }
        } else {
          data = result.data;
          if (optionalSupported === null) {
            setHasOptionalColumns(true);
          }
        }
      }

      // Если колонки не поддерживаются, запрашиваем только базовые
      if (optionalSupported === false) {
        const result = await supabase
          .from('agency_project_finances')
          .select(DB_COLUMNS.join(','));

        if (result.error) throw result.error;
        data = result.data;
      }

      // Преобразуем данные
      const mapped: AgencyFinance[] = (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id,
        project_name: item.project_name || 'Без названия',
        tier: (item.tier || 'pro') as AgencyFinance['tier'],
        package_revenue: Number(item.package_revenue) || 0,
        team_members: item.team_members || '',
        team_salaries: Number(item.team_salaries) || 0,
        software_costs: Number(item.software_costs) || 0,
        other_expenses: Number(item.other_expenses) || 0,
        payment_date: item.payment_date || undefined,
        // Считаем прибыль на фронтенде
        yuri_net_profit: (Number(item.package_revenue) || 0)
          - (Number(item.team_salaries) || 0)
          - (Number(item.software_costs) || 0)
          - (Number(item.other_expenses) || 0),
      }));

      setFinances(mapped);
    } catch (error) {
      console.error('Ошибка загрузки данных агентства:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [hasOptionalColumns]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('agency-finances-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agency_project_finances'
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Обновление финансов проекта
  const updateFinance = useCallback(async (
    projectId: string,
    field: keyof AgencyFinance,
    value: any
  ) => {
    const oldFinances = [...finances];

    // Оптимистичное обновление
    setFinances(prev => prev.map(f =>
      f.project_id === projectId ? { ...f, [field]: value } : f
    ));

    setSavingIds(prev => new Set(prev).add(projectId));

    try {
      const financeData = finances.find(f => f.project_id === projectId);
      if (!financeData) return;

      // Базовая информация — то что точно есть в БД
      const baseData: any = {
        project_id: projectId,
        project_name: field === 'project_name' ? value : financeData.project_name,
        tier: field === 'tier' ? value : financeData.tier,
        package_revenue: field === 'package_revenue' ? value : financeData.package_revenue,
        team_members: field === 'team_members' ? value : financeData.team_members,
        team_salaries: field === 'team_salaries' ? value : financeData.team_salaries,
        software_costs: field === 'software_costs' ? value : financeData.software_costs,
      };

      // Добавляем опциональные колонки если БД их поддерживает
      if (hasOptionalColumns) {
        baseData.other_expenses = field === 'other_expenses' ? value : financeData.other_expenses;
        baseData.payment_date = field === 'payment_date' ? value : financeData.payment_date;
      }

      const { error } = await supabase
        .from('agency_project_finances')
        .upsert(baseData, { onConflict: 'project_id' });

      if (error) {
        // Если ошибка из-за колонок — повторяем без них
        if (error.code === 'PGRST204') {
          setHasOptionalColumns(false);
          const { other_expenses, payment_date, ...safeData } = baseData;
          const { error: retryError } = await supabase
            .from('agency_project_finances')
            .upsert(safeData, { onConflict: 'project_id' });

          if (retryError) throw retryError;

          toast.warning('Сохранено частично. Дополнительные поля (Прочие расходы, Дата оплаты) не поддерживаются текущей версией БД.');
        } else {
          throw error;
        }
      }

      // Пересчитываем прибыль на фронтенде
      setFinances(prev => prev.map(f => {
        if (f.project_id !== projectId) return f;
        const updated = { ...f, [field]: value };
        updated.yuri_net_profit = updated.package_revenue
          - updated.team_salaries
          - updated.software_costs
          - (updated.other_expenses || 0);
        return updated;
      }));

      toast.success('💰 Данные обновлены', { duration: 1000 });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошибка сохранения');
      setFinances(oldFinances);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }, [finances, hasOptionalColumns]);

  // Подсчёт итогов
  const totals = {
    totalRevenue: finances.reduce((sum, f) => sum + f.package_revenue, 0),
    totalExpenses: finances.reduce((sum, f) => sum + f.team_salaries + f.software_costs + (f.other_expenses || 0), 0),
    yuriNetProfit: finances.reduce((sum, f) => sum + (f.yuri_net_profit || 0), 0),
    projectsCount: finances.length,
    profitableProjects: finances.filter(f => (f.yuri_net_profit || 0) > 0).length,
    myProfitTotal: finances.reduce((sum, f) => sum + (f.package_revenue - f.team_salaries), 0),
    netProfitTotal: finances.reduce((sum, f) => sum + (f.package_revenue - f.team_salaries - f.software_costs - (f.other_expenses || 0)), 0),
  };

  // Добавление проекта — ТОЛЬКО в agency_project_finances, без связи с projects
  const addProject = useCallback(async (name: string) => {
    try {
      if (!name.trim()) {
        toast.error('Введите название проекта');
        return;
      }

      const newId = crypto.randomUUID();

      const insertData: any = {
        project_id: newId,
        project_name: name.trim(),
        tier: 'pro',
        package_revenue: 0,
        team_salaries: 0,
        software_costs: 0,
      };

      // Добавляем опциональные колонки если поддерживаются
      if (hasOptionalColumns) {
        insertData.other_expenses = 0;
      }

      const { error } = await supabase
        .from('agency_project_finances')
        .insert(insertData);

      if (error) {
        // Если ошибка из-за колонок — повторяем без них
        if (error.code === 'PGRST204') {
          setHasOptionalColumns(false);
          const { other_expenses, ...safeData } = insertData;
          const { error: retryError } = await supabase
            .from('agency_project_finances')
            .insert(safeData);
          if (retryError) throw retryError;
        } else if (error.message?.includes('foreign key')) {
          // Если есть FK на projects — создаём проект сначала
          const { data: auth } = await supabase.auth.getUser();
          const userId = auth.user?.id || null;

          const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
              id: newId,
              name: name.trim(),
              user_id: userId,
              owner_id: userId,
              status: 'active',
              onboarding_status: 'draft',
            })
            .select()
            .single();

          if (projectError) throw projectError;

          // Повторяем вставку в agency_project_finances
          const retryInsert: any = {
            project_id: project.id,
            project_name: name.trim(),
            tier: 'pro',
            package_revenue: 0,
            team_salaries: 0,
            software_costs: 0,
          };

          const { error: retryError } = await supabase
            .from('agency_project_finances')
            .insert(retryInsert);

          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      toast.success('Проект добавлен');
      await fetchData();
    } catch (error) {
      console.error('Ошибка добавления проекта:', error);
      toast.error('Не удалось добавить проект');
    }
  }, [fetchData, hasOptionalColumns]);

  return {
    finances,
    loading,
    savingIds,
    totals,
    updateFinance,
    addProject,
    refetch: fetchData,
  };
};
