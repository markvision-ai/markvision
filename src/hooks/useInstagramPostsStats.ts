import { useState, useEffect } from 'react';
import { supabase } from '@/lib/externalSupabase';

export interface InstagramPostStat {
  id: string;
  post_id: string;
  caption: string | null;
  media_type: string | null;
  media_url: string | null;
  permalink: string | null;
  timestamp: string | null;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  leads_count: number;
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

        const { data, error: fetchError } = await supabase
          .from('instagram_posts_stats')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (fetchError) throw fetchError;

        setPosts(data || []);
      } catch (err: any) {
        console.error('Error fetching Instagram posts stats:', err);
        setError(err.message || 'Failed to load Instagram posts');
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
