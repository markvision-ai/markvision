import { useState, useEffect, useMemo } from 'react';
import { useInstagramPostsStats } from './useInstagramPostsStats';
import { useContentProductionStats } from './useContentProductionStats';

export interface ContentPlanFactData {
  metric: string;
  plan: number;
  fact: number;
  unit: string;
}

export const useInstagramPlanFact = (projectId: string | null) => {
  const { posts } = useInstagramPostsStats(projectId);
  // Получаем агрегированные метрики из content_production_stats
  const { stats: aggregatedStats, loading: statsLoading } = useContentProductionStats(
    projectId,
    '2026-01-01',
    '2026-01-22'
  );
  const [planData, setPlanData] = useState<ContentPlanFactData[]>([
    { metric: 'Публикации', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Сторис', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Охват', plan: 500000, fact: 0, unit: '' },
    { metric: 'Вовлеченность', plan: 8, fact: 0, unit: '%' },
    { metric: 'Новые подписчики', plan: 5000, fact: 0, unit: '' },
    { metric: 'Диагностики', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Продажи', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Сумма продаж', plan: 0, fact: 0, unit: '₸' },
  ]);

  // Автоматически считаем факт из агрегированных данных или из постов
  const calculatedFact = useMemo(() => {
    // Если есть агрегированные данные - используем их
    if (aggregatedStats && !statsLoading) {
      console.log('✅ Используем агрегированные метрики из content_production_stats');
      return {
        publications: aggregatedStats.publications || 0,
        stories: aggregatedStats.stories || 0,
        reach: aggregatedStats.reach || 0,
        engagement: aggregatedStats.engagement || 0,
        followers: aggregatedStats.followers || 0,
        diagnostics: aggregatedStats.diagnostics || 0,
        sales: aggregatedStats.sales || 0,
        revenue: aggregatedStats.revenue || 0,
      };
    }

    // Иначе считаем из постов
    if (!posts || posts.length === 0) {
      return {
        publications: 0,
        stories: 0,
        reach: 0,
        engagement: 0,
        followers: 0,
        diagnostics: 0,
        sales: 0,
        revenue: 0,
      };
    }

    // Период: с 1 января по 22 января 2026
    const periodStart = new Date('2026-01-01T00:00:00.000Z');
    const periodEnd = new Date('2026-01-22T23:59:59.999Z');

    // Фильтруем посты за период
    const periodPosts = posts.filter(post => {
      if (!post.posted_at) return false;
      const postDate = new Date(post.posted_at);
      return postDate >= periodStart && postDate <= periodEnd;
    });

    // Считаем Stories (только Stories)
    const stories = periodPosts.filter(p => {
      const mediaType = (p.media_type || '').toLowerCase();
      return mediaType.includes('story') || mediaType === 'stories';
    }).length;

    // Считаем Публикации (все остальное: Reels, Carousels, обычные посты)
    const publications = periodPosts.filter(p => {
      const mediaType = (p.media_type || '').toLowerCase();
      return !mediaType.includes('story') && mediaType !== 'stories';
    }).length;

    // Суммируем метрики за весь период
    const totalReach = periodPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
    const totalImpressions = periodPosts.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalLikes = periodPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = periodPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalShares = periodPosts.reduce((sum, p) => sum + (p.shares || 0), 0);

    // Вовлеченность = (лайки + комментарии + репосты) / показы * 100
    const engagement = totalImpressions > 0 
      ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100 
      : 0;

    // Бизнес-метрики (из постов, если есть)
    const totalDiagnostics = periodPosts.reduce((sum, p) => sum + (p.leads_count || 0), 0);
    const totalSales = periodPosts.reduce((sum, p) => sum + (p.paid_leads || 0), 0);
    const totalRevenue = periodPosts.reduce((sum, p) => sum + (p.revenue || 0), 0);

    console.log(`📊 Период 1-22 января 2026 (из постов): ${publications} публикаций, ${stories} сторис, охват: ${totalReach}`);

    return {
      publications,
      stories,
      reach: totalReach,
      engagement: Math.round(engagement * 100) / 100, // 2 знака после запятой
      followers: 0, // TODO: получить из Instagram Insights API
      diagnostics: totalDiagnostics,
      sales: totalSales,
      revenue: totalRevenue,
    };
  }, [posts, aggregatedStats, statsLoading]);

  // Обновляем факт автоматически
  useEffect(() => {
    setPlanData(prev => prev.map(item => {
      switch (item.metric) {
        case 'Публикации':
          return { ...item, fact: calculatedFact.publications };
        case 'Сторис':
          return { ...item, fact: calculatedFact.stories };
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
