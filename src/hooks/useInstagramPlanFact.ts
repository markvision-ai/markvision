// @ts-nocheck
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
  // Период: с 1 января по вчерашний день (как в workflow)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1); // Вчерашний день
  const periodStart = '2026-01-01';
  const periodEnd = yesterday.toISOString().split('T')[0]; // Вчерашняя дата
  
  const { stats: aggregatedStats, loading: statsLoading } = useContentProductionStats(
    projectId,
    periodStart,
    periodEnd
  );
  const [planData, setPlanData] = useState<ContentPlanFactData[]>([
    { metric: 'Новые подписчики', plan: 5000, fact: 0, unit: '' },
    { metric: 'Публикации', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Охват', plan: 500000, fact: 0, unit: '' },
    { metric: 'Комментарии', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Лиды', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Диагностики', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Продажи', plan: 0, fact: 0, unit: 'шт' },
    { metric: 'Сумма продаж', plan: 0, fact: 0, unit: '₸' },
  ]);

  // Автоматически считаем факт из агрегированных данных или из постов
  const calculatedFact = useMemo(() => {
    // Если есть агрегированные данные - используем их
    if (aggregatedStats && !statsLoading) {
      console.log('✅ Используем агрегированные метрики из content_production_stats');
      console.log('   Период:', aggregatedStats.period_start, '-', aggregatedStats.period_end);
      console.log('   Публикации:', aggregatedStats.publications);
      console.log('   Охват:', aggregatedStats.reach);
      console.log('   Комментарии:', aggregatedStats.comments);
      console.log('   Подписчики:', aggregatedStats.followers);
      return {
        publications: aggregatedStats.publications || 0,
        reach: aggregatedStats.reach || 0,
        comments: aggregatedStats.comments || 0,
        followers: aggregatedStats.followers || 0,
        leads: 0, // Будет заполняться с сайта через UTM метки
        diagnostics: aggregatedStats.diagnostics || 0,
        sales: aggregatedStats.sales || 0,
        revenue: aggregatedStats.revenue || 0,
      };
    }

    // Иначе считаем из постов
    if (!posts || posts.length === 0) {
      return {
        publications: 0,
        reach: 0,
        comments: 0,
        followers: 0,
        leads: 0, // Будет заполняться с сайта через UTM метки
        diagnostics: 0,
        sales: 0,
        revenue: 0,
      };
    }

    // Период: с 1 января по вчерашний день (как в workflow)
    const periodStartDate = new Date('2026-01-01T00:00:00.000Z');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1); // Вчерашний день
    yesterdayDate.setHours(23, 59, 59, 999); // Конец вчерашнего дня
    const periodEndDate = yesterdayDate;

    // Фильтруем посты за период
    const periodPosts = posts.filter(post => {
      if (!post.posted_at) return false;
      const postDate = new Date(post.posted_at);
      return postDate >= periodStartDate && postDate <= periodEndDate;
    });

    // Считаем Публикации (Reels, Carousels, обычные посты - без Stories)
    const publications = periodPosts.filter(p => {
      const mediaType = (p.media_type || '').toLowerCase();
      return !mediaType.includes('story') && mediaType !== 'stories';
    }).length;

    // Суммируем метрики за весь период
    const totalReach = periodPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
    const totalImpressions = periodPosts.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalLikes = periodPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalShares = periodPosts.reduce((sum, p) => sum + (p.shares || 0), 0);

    // Комментарии = сумма всех комментариев
    const totalComments = periodPosts.reduce((sum, p) => sum + (p.comments || 0), 0);

    // Бизнес-метрики (из постов, если есть)
    const totalDiagnostics = periodPosts.reduce((sum, p) => sum + (p.leads_count || 0), 0);
    const totalSales = periodPosts.reduce((sum, p) => sum + (p.paid_leads || 0), 0);
    const totalRevenue = periodPosts.reduce((sum, p) => sum + (p.revenue || 0), 0);

    const periodEndStr = periodEndDate.toISOString().split('T')[0];
    console.log(`📊 Период 1 января - ${periodEndStr} (из постов): ${publications} публикаций, охват: ${totalReach}, комментарии: ${totalComments}`);
    console.log('   Всего постов в базе:', posts.length);
    console.log('   Постов в периоде:', periodPosts.length);
    console.log('   Публикации (не Stories):', publications);

    return {
      publications,
      reach: totalReach,
      comments: totalComments,
      followers: 0, // TODO: получить из Instagram Insights API
      leads: 0, // Будет заполняться с сайта через UTM метки
      diagnostics: totalDiagnostics,
      sales: totalSales,
      revenue: totalRevenue,
    };
  }, [posts, aggregatedStats, statsLoading]);

  // Обновляем факт автоматически
  useEffect(() => {
    console.log('📊 useInstagramPlanFact - Обновление факта:', {
      calculatedFact,
      postsCount: posts?.length || 0,
      aggregatedStats,
      statsLoading
    });
    
    setPlanData(prev => prev.map(item => {
      let newFact = item.fact;
      switch (item.metric) {
        case 'Новые подписчики':
          newFact = calculatedFact.followers;
          break;
        case 'Публикации':
          newFact = calculatedFact.publications;
          break;
        case 'Охват':
          newFact = calculatedFact.reach;
          break;
        case 'Комментарии':
          newFact = calculatedFact.comments;
          break;
        case 'Лиды':
          newFact = calculatedFact.leads;
          break;
        case 'Диагностики':
          newFact = calculatedFact.diagnostics;
          break;
        case 'Продажи':
          newFact = calculatedFact.sales;
          break;
        case 'Сумма продаж':
          newFact = calculatedFact.revenue;
          break;
        default:
          return item;
      }
      
      if (newFact !== item.fact) {
        console.log(`✅ ${item.metric}: ${item.fact} → ${newFact}`);
      }
      
      return { ...item, fact: newFact };
    }));
  }, [calculatedFact, posts, aggregatedStats, statsLoading]);

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
