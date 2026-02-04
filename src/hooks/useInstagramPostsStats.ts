import { useState, useEffect } from 'react';
import { supabase } from '@/lib/externalSupabase';

export interface InstagramPostStat {
  id: string;
  post_id: string;
  caption: string | null;
  media_type: string | null;
  media_url: string | null;
  permalink: string | null;
  posted_at: string | null;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  leads_count: number;
  visits_count: number;
  paid_leads: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export const useInstagramPostsStats = (projectId: string | null) => {
  const [posts, setPosts] = useState<InstagramPostStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!projectId) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: postsData, error: fetchError } = await supabase
          .from('instagram_posts_stats')
          .select('*')
          .eq('project_id', projectId) // Filter by project_id
          .order('posted_at', { ascending: false })
          .limit(50);

        if (fetchError) {
          console.error('Supabase fetch error:', fetchError);
          // Если таблица не существует или RLS блокирует
          if (fetchError.code === 'PGRST116' || fetchError.message?.includes('does not exist')) {
            setError('Таблица instagram_posts_stats не найдена. Выполни SQL миграцию в Supabase.');
          } else if (fetchError.code === 'PGRST301' || fetchError.message?.includes('permission denied')) {
            setError('Нет доступа к таблице. Проверь RLS политики в Supabase.');
          } else {
            setError(fetchError.message || 'Ошибка загрузки данных');
          }
          setPosts([]);
          return;
        }

        // Fetch linked leads to calculate metrics
        const postIds = postsData.map(p => p.post_id).filter(Boolean);
        let leadsData: any[] = [];
        
        if (postIds.length > 0) {
          const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, post_id, status, deal_amount, revenue')
            .eq('project_id', projectId)
            .in('post_id', postIds);
            
          if (!leadsError && leads) {
            leadsData = leads;
          }
        }

        // Group leads by post_id
        const leadsByPost = new Map<string, any[]>();
        leadsData.forEach(lead => {
          if (!lead.post_id) return;
          const existing = leadsByPost.get(lead.post_id) || [];
          existing.push(lead);
          leadsByPost.set(lead.post_id, existing);
        });

        // Merge metrics
        const mergedPosts = postsData.map(post => {
          const postLeads = leadsByPost.get(post.post_id) || [];
          
          const leadsCount = postLeads.length;
          const visitsCount = postLeads.filter(l => 
            ['visit_completed', 'visit', 'meeting', 'consultation', 'scheduled'].some(s => l.status?.toLowerCase().includes(s))
          ).length;
          
          const paidLeads = postLeads.filter(l => 
            ['won', 'paid', 'success'].some(s => l.status?.toLowerCase().includes(s)) || (l.deal_amount && l.deal_amount > 0)
          ).length;
          
          const revenue = postLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);

          return {
            ...post,
            leads_count: leadsCount,
            visits_count: visitsCount,
            paid_leads: paidLeads,
            revenue: revenue
          };
        });

        console.log(`✅ Загружено постов: ${mergedPosts.length || 0}`);
        setPosts(mergedPosts);
      } catch (err: any) {
        console.error('Error fetching Instagram posts stats:', err);
        setError(err.message || 'Failed to load Instagram posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('instagram_posts_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instagram_posts_stats',
        },
        () => {
          // Refetch on any change
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { posts, loading, error };
};
