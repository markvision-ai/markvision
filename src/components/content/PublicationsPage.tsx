import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Search, 
  Filter, 
  Calendar, 
  ChevronDown,
  Eye,
  MessageCircle,
  MousePointer2,
  TrendingUp,
  DollarSign,
  LayoutGrid,
  List,
  Youtube,
  Instagram,
  Globe,
  Send,
  Loader2
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons for channels
const ChannelIcon = ({ channel, className }: { channel: string, className?: string }) => {
  switch (channel.toLowerCase()) {
    case 'instagram': return <Instagram className={cn("text-pink-500", className)} />;
    case 'youtube': return <Youtube className={cn("text-red-500", className)} />;
    case 'tiktok': return <div className={cn("text-black dark:text-white font-bold text-xs", className)}>TT</div>; // Custom icon or similar
    case 'threads': return <div className={cn("text-black dark:text-white font-bold text-xs", className)}>@</div>;
    case 'telegram': return <Send className={cn("text-blue-400", className)} />;
    case 'site': return <Globe className={cn("text-blue-500", className)} />;
    default: return <LayoutGrid className={cn("text-gray-400", className)} />;
  }
};

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

interface PostStats {
  id: string;
  post_id: string;
  media_url: string | null;
  caption: string | null;
  media_type: string | null;
  permalink: string | null;
  posted_at: string | null;
  reach: number;
  comments: number;
  likes: number;
  channel: string; // Derived
  
  // Funnel stats (calculated from leads)
  clicks: number; // Placeholder or from stats
  leads_count: number;
  diagnostics_count: number;
  sales_count: number;
  revenue: number;
}

export const PublicationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostStats[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostStats | null>(null);
  const [promoting, setPromoting] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Instagram Posts Stats (serving as "Publications")
        // We filter by project_id
        const { data: postsData, error: postsError } = await supabase
          .from('instagram_posts_stats')
          .select('*')
          .eq('project_id', TARGET_PROJECT_ID)
          .order('posted_at', { ascending: false });

        if (postsError) throw postsError;

        if (!postsData) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // 2. Fetch Leads linked to these posts
        // We get all leads for this project that have a post_id
        const postIds = postsData.map(p => p.post_id).filter(Boolean);
        
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, post_id, status, revenue')
          .eq('project_id', TARGET_PROJECT_ID)
          .in('post_id', postIds);

        if (leadsError) {
          console.error("Error fetching leads:", leadsError);
          // Continue without leads data
        }

        // 3. Merge Data
        const mergedPosts: PostStats[] = postsData.map(post => {
          const postLeads = leadsData?.filter(l => l.post_id === post.post_id) || [];
          
          const leadsCount = postLeads.length;
          const diagnosticsCount = postLeads.filter(l => l.status === 'diagnostic' || l.status === 'meeting').length; // Adjust statuses as needed
          const salesCount = postLeads.filter(l => l.status === 'won' || l.status === 'paid' || (l.revenue && l.revenue > 0)).length;
          const revenue = postLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);

          return {
            id: post.id,
            post_id: post.post_id,
            media_url: post.media_url,
            caption: post.caption,
            media_type: post.media_type,
            permalink: post.permalink,
            posted_at: post.posted_at,
            reach: post.reach || 0,
            comments: post.comments || 0,
            likes: post.likes || 0,
            channel: 'instagram', // Currently only fetching instagram
            clicks: 0, // Placeholder, maybe derived from UTM clicks if available elsewhere
            leads_count: leadsCount,
            diagnostics_count: diagnosticsCount,
            sales_count: salesCount,
            revenue: revenue
          };
        });

        setPosts(mergedPosts);

      } catch (error) {
        console.error("Error loading publications:", error);
        toast.error("Ошибка загрузки публикаций");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]); // Reload when period changes? actually filtering is client side usually better for UX if data is small

  // Filter Logic
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // Channel Filter
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(p => p.channel === selectedChannel);
    }

    // Period Filter
    const now = new Date();
    if (period === 'today') {
      filtered = filtered.filter(p => p.posted_at && isWithinInterval(parseISO(p.posted_at), { start: subDays(now, 1), end: now }));
    } else if (period === 'week') {
      filtered = filtered.filter(p => p.posted_at && isWithinInterval(parseISO(p.posted_at), { start: startOfWeek(now), end: now }));
    } else if (period === 'month') {
      filtered = filtered.filter(p => p.posted_at && isWithinInterval(parseISO(p.posted_at), { start: startOfMonth(now), end: now }));
    }

    return filtered;
  }, [posts, period, selectedChannel]);

  // Promote Action
  const handlePromoteClick = (post: PostStats) => {
    setSelectedPost(post);
    setPromoteDialogOpen(true);
  };

  const confirmPromote = async () => {
    if (!selectedPost) return;
    setPromoting(true);
    try {
      const { error } = await supabase
        .from('ai_commands')
        .insert({
          project_id: TARGET_PROJECT_ID,
          type: 'promote_post',
          status: 'pending',
          payload: {
            post_id: selectedPost.post_id,
            budget: 20000,
            currency: 'KZT',
            predicted_leads: 50
          }
        });

      if (error) throw error;

      toast.success("Команда отправлена ИИ-таргетологу!");
      setPromoteDialogOpen(false);
    } catch (error) {
      console.error("Error promoting post:", error);
      toast.error("Ошибка запуска продвижения");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background/50">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Публикации
          </h1>
          <p className="text-muted-foreground mt-1">
            Центр управления контентом и продвижением
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-card/50 p-1 rounded-lg border border-white/5">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-auto">
            <TabsList className="bg-transparent">
              <TabsTrigger value="today" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Сегодня</TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Неделя</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Месяц</TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Все время</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Channel Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'instagram', 'youtube', 'tiktok', 'telegram', 'site'].map(channel => (
          <Button
            key={channel}
            variant={selectedChannel === channel ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChannel(channel)}
            className={cn(
              "gap-2 border-white/5 bg-black/20 hover:bg-white/5 transition-all",
              selectedChannel === channel && "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30"
            )}
          >
            {channel === 'all' ? <LayoutGrid className="w-4 h-4" /> : <ChannelIcon channel={channel} className="w-4 h-4" />}
            <span className="capitalize">{channel === 'all' ? 'Все каналы' : channel}</span>
          </Button>
        ))}
      </div>

      {/* Bento Table */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Нет публикаций за выбранный период
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Контент</div>
              <div className="col-span-1 text-center">Канал</div>
              <div className="col-span-2 text-center">Охват / Комменты</div>
              <div className="col-span-1 text-center">Клики</div>
              <div className="col-span-2 text-center">Воронка</div>
              <div className="col-span-1 text-right">Выручка</div>
              <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative grid grid-cols-12 gap-4 items-center p-4 rounded-xl bg-card/30 border border-white/5 hover:border-primary/50 hover:bg-card/50 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                >
                  {/* Neon Glow Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Content */}
                  <div className="col-span-4 flex items-center gap-3 relative z-10">
                    <div className="h-12 w-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                      {post.media_url ? (
                        <img src={post.media_url} alt="Post" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Eye className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate max-w-[200px]" title={post.caption || ''}>
                        {post.caption || 'Без названия'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.posted_at ? format(parseISO(post.posted_at), 'dd MMM HH:mm', { locale: ru }) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Channel */}
                  <div className="col-span-1 flex justify-center relative z-10">
                    <div className="p-2 rounded-full bg-white/5 border border-white/5">
                      <ChannelIcon channel={post.channel} className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Reach / Comments */}
                  <div className="col-span-2 flex flex-col items-center gap-1 relative z-10">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>{new Intl.NumberFormat('ru-RU').format(post.reach)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MessageCircle className="w-3 h-3" />
                      <span>{post.comments}</span>
                    </div>
                  </div>

                  {/* Clicks */}
                  <div className="col-span-1 flex justify-center relative z-10">
                    <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-xs font-normal">
                      {post.clicks}
                    </Badge>
                  </div>

                  {/* Funnel */}
                  <div className="col-span-2 flex items-center justify-center gap-1 text-xs font-medium relative z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-purple-400">{post.leads_count}</span>
                      <span className="text-[10px] text-muted-foreground">L</span>
                    </div>
                    <div className="w-4 h-[1px] bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-yellow-400">{post.diagnostics_count}</span>
                      <span className="text-[10px] text-muted-foreground">D</span>
                    </div>
                    <div className="w-4 h-[1px] bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-green-400">{post.sales_count}</span>
                      <span className="text-[10px] text-muted-foreground">S</span>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="col-span-1 text-right relative z-10">
                    <span className="text-sm font-bold text-green-400">
                      {new Intl.NumberFormat('ru-RU').format(post.revenue)} ₸
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end relative z-10">
                    <Button 
                      size="sm" 
                      className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_-3px_rgba(59,130,246,0.7)] transition-all duration-300"
                      onClick={() => handlePromoteClick(post)}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      ПРОДВИГАТЬ
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Promote Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Запуск продвижения
            </DialogTitle>
            <DialogDescription>
              ИИ-таргетолог проанализировал пост и подготовил прогноз.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-card border border-white/5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 rounded-md bg-black/40 overflow-hidden flex-shrink-0">
                   {selectedPost?.media_url && (
                     <img src={selectedPost.media_url} alt="Preview" className="h-full w-full object-cover" />
                   )}
                </div>
                <div>
                  <h4 className="font-medium text-sm line-clamp-2">{selectedPost?.caption}</h4>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" /> {selectedPost?.reach}
                    <TrendingUp className="w-3 h-3 text-green-400" /> High Potential
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <div className="text-xs text-muted-foreground mb-1">Прогноз лидов</div>
                <div className="text-xl font-bold text-primary">+50</div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <div className="text-xs text-muted-foreground mb-1">Бюджет</div>
                <div className="text-xl font-bold text-green-400">20 000 ₸</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>Отмена</Button>
            <Button onClick={confirmPromote} disabled={promoting} className="bg-primary hover:bg-primary/90">
              {promoting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
              Запустить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
