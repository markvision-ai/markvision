import { useState, useEffect, useMemo } from 'react';
import { useInstagramPostsStats } from './useInstagramPostsStats';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface ContentPlanFactData {
  metric: string;
  plan: number;
  fact: number;
  unit: string;
}

export const useInstagramPlanFact = (projectId: string | null) => {
  const { posts } = useInstagramPostsStats(projectId);
  const [planData, setPlanData] = useState<ContentPlanFactData[]>([
    { metric: 'Reels/месяц', plan: 30, fact: 0, unit: 'шт' },
    { metric: 'Stories/месяц', plan: 90, fact: 0, unit: 'шт' },
    { metric: 'Карусели/месяц', plan: 12, fact: 0, unit: 'шт' },
    { metric: 'Охват', plan: 500000, fact: 0, unit: '' },
    { metric: 'Вовлеченность', plan: 8, fact: 0, unit: '%' },
    { metric: 'Новые подписчики', plan: 5000, fact: 0, unit: '' },
    { metric: 'Диагностики', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Продажи', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Сумма продаж', plan: 0, fact: 0, unit: '₸' },
  ]);

  // Автоматически считаем факт из Instagram данных за текущий месяц
  const calculatedFact = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        reels: 0,
        stories: 0,
        carousels: 0,
        reach: 0,
        engagement: 0,
        followers: 0, // Это нужно из другого источника
        diagnostics: 0,
        sales: 0,
        revenue: 0,
      };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Фильтруем посты за текущий месяц
    const monthPosts = posts.filter(post => {
      if (!post.posted_at) return false;
      const postDate = new Date(post.posted_at);
      return postDate >= monthStart && postDate <= monthEnd;
    });

    // Считаем по типам
    const reels = monthPosts.filter(p => 
      p.media_type?.toLowerCase().includes('reel') || 
      p.media_type === 'REELS'
    ).length;

    const stories = monthPosts.filter(p => 
      p.media_type?.toLowerCase().includes('story') || 
      p.media_type === 'STORIES'
    ).length;

    const carousels = monthPosts.filter(p => 
      p.media_type?.toLowerCase().includes('carousel') || 
      p.media_type === 'CAROUSEL_ALBUM'
    ).length;

    // Суммируем метрики
    const totalReach = monthPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
    const totalImpressions = monthPosts.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalLikes = monthPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = monthPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalShares = monthPosts.reduce((sum, p) => sum + (p.shares || 0), 0);

    // Вовлеченность = (лайки + комментарии + репосты) / показы * 100
    const engagement = totalImpressions > 0 
      ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100 
      : 0;

    // Бизнес-метрики (из постов, если есть)
    const totalDiagnostics = monthPosts.reduce((sum, p) => sum + (p.leads_count || 0), 0); // Пока используем leads_count как диагностики
    const totalSales = monthPosts.reduce((sum, p) => sum + (p.paid_leads || 0), 0);
    const totalRevenue = monthPosts.reduce((sum, p) => sum + (p.revenue || 0), 0);

    return {
      reels,
      stories,
      carousels,
      reach: totalReach,
      engagement: Math.round(engagement * 100) / 100, // 2 знака после запятой
      followers: 0, // TODO: получить из Instagram Insights API
      diagnostics: totalDiagnostics,
      sales: totalSales,
      revenue: totalRevenue,
    };
  }, [posts]);

  // Обновляем факт автоматически
  useEffect(() => {
    setPlanData(prev => prev.map(item => {
      switch (item.metric) {
        case 'Reels/месяц':
          return { ...item, fact: calculatedFact.reels };
        case 'Stories/месяц':
          return { ...item, fact: calculatedFact.stories };
        case 'Карусели/месяц':
          return { ...item, fact: calculatedFact.carousels };
        case 'Охват':
          return { ...item, fact: calculatedFact.reach };
        case 'Вовлеченность':
          return { ...item, fact: calculatedFact.engagement };
        case 'Новые подписчики':
          return { ...item, fact: calculatedFact.followers };
        case 'Диагностики':
          return { ...item, fact: calculatedFact.diagnostics };
        case 'Продажи':
          return { ...item, fact: calculatedFact.sales };
        case 'Сумма продаж':
          return { ...item, fact: calculatedFact.revenue };
        default:
          return item;
      }
    }));
  }, [calculatedFact]);

  const updatePlan = (metric: string, plan: number) => {
    setPlanData(prev => prev.map(item => 
      item.metric === metric ? { ...item, plan } : item
    ));
  };

  return {
    planData,
    updatePlan,
    calculatedFact,
  };
};
