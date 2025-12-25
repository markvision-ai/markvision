import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  projectId?: string;
  projectName?: string;
}

interface AnalyticsData {
  projectId: string;
  projectName: string;
  leads: number;
  sales: number;
  spend: number;
  revenue: number;
  cpl: number;
  conversionRate: number;
  trend: 'up' | 'down' | 'stable';
}

export const useNotifications = (projectId?: string) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const generateNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const newNotifications: Notification[] = [];

    try {
      // Get last 7 days data
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name');

      if (!projects || projects.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Fetch current week data
      const { data: currentWeekData } = await supabase
        .from('daily_data')
        .select('*')
        .gte('date', weekAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);

      // Fetch previous week data for comparison
      const { data: prevWeekData } = await supabase
        .from('daily_data')
        .select('*')
        .gte('date', twoWeeksAgo.toISOString().split('T')[0])
        .lt('date', weekAgo.toISOString().split('T')[0]);

      // Aggregate by project
      const currentByProject = new Map<string, { leads: number; sales: number; spend: number; revenue: number }>();
      const prevByProject = new Map<string, { leads: number; sales: number; spend: number; revenue: number }>();

      (currentWeekData || []).forEach(row => {
        const existing = currentByProject.get(row.project_id) || { leads: 0, sales: 0, spend: 0, revenue: 0 };
        currentByProject.set(row.project_id, {
          leads: existing.leads + row.leads,
          sales: existing.sales + row.sales,
          spend: existing.spend + Number(row.spend),
          revenue: existing.revenue + Number(row.revenue),
        });
      });

      (prevWeekData || []).forEach(row => {
        const existing = prevByProject.get(row.project_id) || { leads: 0, sales: 0, spend: 0, revenue: 0 };
        prevByProject.set(row.project_id, {
          leads: existing.leads + row.leads,
          sales: existing.sales + row.sales,
          spend: existing.spend + Number(row.spend),
          revenue: existing.revenue + Number(row.revenue),
        });
      });

      // Generate notifications for each project
      for (const project of projects) {
        if (projectId && project.id !== projectId) continue;

        const current = currentByProject.get(project.id);
        const prev = prevByProject.get(project.id);

        if (!current) continue;

        const cpl = current.leads > 0 ? current.spend / current.leads : 0;
        const prevCpl = prev && prev.leads > 0 ? prev.spend / prev.leads : 0;
        const conversionRate = current.leads > 0 ? (current.sales / current.leads) * 100 : 0;
        const prevConversionRate = prev && prev.leads > 0 ? (prev.sales / prev.leads) * 100 : 0;

        // High CPL warning (if CPL increased by more than 20%)
        if (prevCpl > 0 && cpl > prevCpl * 1.2) {
          const increase = ((cpl - prevCpl) / prevCpl * 100).toFixed(0);
          newNotifications.push({
            id: `cpl-high-${project.id}`,
            type: 'warning',
            title: 'Высокая стоимость лида',
            message: `${project.name}: CPL вырос на ${increase}% (${cpl.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₸)`,
            createdAt: new Date(),
            read: false,
            projectId: project.id,
            projectName: project.name,
          });
        }

        // Low conversion rate warning
        if (prevConversionRate > 0 && conversionRate < prevConversionRate * 0.7 && current.leads >= 5) {
          newNotifications.push({
            id: `conversion-low-${project.id}`,
            type: 'warning',
            title: 'Снижение конверсии',
            message: `${project.name}: конверсия упала до ${conversionRate.toFixed(1)}%`,
            createdAt: new Date(),
            read: false,
            projectId: project.id,
            projectName: project.name,
          });
        }

        // No leads warning
        if (current.leads === 0 && current.spend > 0) {
          newNotifications.push({
            id: `no-leads-${project.id}`,
            type: 'error',
            title: 'Нет заявок',
            message: `${project.name}: потрачено ${current.spend.toLocaleString('ru-RU')} ₸ без заявок`,
            createdAt: new Date(),
            read: false,
            projectId: project.id,
            projectName: project.name,
          });
        }

        // Good performance notification
        if (prevCpl > 0 && cpl < prevCpl * 0.8 && current.leads >= 5) {
          const decrease = ((prevCpl - cpl) / prevCpl * 100).toFixed(0);
          newNotifications.push({
            id: `cpl-good-${project.id}`,
            type: 'success',
            title: 'CPL снизился',
            message: `${project.name}: стоимость лида упала на ${decrease}%`,
            createdAt: new Date(),
            read: false,
            projectId: project.id,
            projectName: project.name,
          });
        }

        // High spend without revenue
        if (current.spend > 100000 && current.revenue === 0) {
          newNotifications.push({
            id: `no-revenue-${project.id}`,
            type: 'warning',
            title: 'Нет выручки',
            message: `${project.name}: расход ${current.spend.toLocaleString('ru-RU')} ₸, выручки нет`,
            createdAt: new Date(),
            read: false,
            projectId: project.id,
            projectName: project.name,
          });
        }

        // Great week notification
        if (prev && current.revenue > prev.revenue * 1.3 && current.revenue > 0) {
          const increase = ((current.revenue - prev.revenue) / prev.revenue * 100).toFixed(0);
          newNotifications.push({
            id: `revenue-up-${project.id}`,
            type: 'success',
            title: 'Рост выручки',
            message: `${project.name}: выручка выросла на ${increase}%`,
            createdAt: new Date(),
            read: false,
            projectId: project.id,
            projectName: project.name,
          });
        }
      }

      // Check for new leads today
      const todayStr = today.toISOString().split('T')[0];
      const { data: todayLeads, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStr);

      if (count && count > 0) {
        newNotifications.push({
          id: `new-leads-today`,
          type: 'info',
          title: 'Новые заявки',
          message: `Сегодня поступило ${count} ${count === 1 ? 'заявка' : count < 5 ? 'заявки' : 'заявок'}`,
          createdAt: new Date(),
          read: false,
        });
      }

      // Sort by type priority and date
      const typePriority = { error: 0, warning: 1, info: 2, success: 3 };
      newNotifications.sort((a, b) => {
        const priorityDiff = typePriority[a.type] - typePriority[b.type];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    generateNotifications();
    
    // Refresh every 5 minutes
    const interval = setInterval(generateNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refresh: generateNotifications,
  };
};
