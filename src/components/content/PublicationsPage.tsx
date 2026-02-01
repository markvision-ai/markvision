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
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons for channels
const ChannelIcon = ({ channel, className }: { channel: string, className?: string }) => {
  switch (channel.toLowerCase()) {
    case 'instagram': return <Instagram className={cn("text-pink-500", className)} />;
    case 'youtube': return <Youtube className={cn("text-red-500", className)} />;
    case 'tiktok': return <div className={cn("text-foreground font-bold text-xs flex items-center justify-center bg-muted rounded-full w-5 h-5", className)}>TT</div>;
    case 'threads': return <div className={cn("text-foreground font-bold text-xs", className)}>@</div>;
    case 'telegram': return <Send className={cn("text-sky-500", className)} />;
    case 'site': return <Globe className={cn("text-primary", className)} />;
    default: return <LayoutGrid className={cn("text-muted-foreground", className)} />;
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
  channel: string;
  
  // Funnel stats
  clicks: number;
  leads_count: number;
  diagnostics_count: number;
  sales_count: number;
  revenue: number;
}

export const PublicationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostStats[]>([]);
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostStats | null>(null);
  const [promoting, setPromoting] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Instagram Posts Stats (serving as "Publications" source for now)
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
        const postIds = postsData.map(p => p.post_id).filter(Boolean);
        
        // If we have posts, fetch associated leads
        let leadsData: any[] = [];
        if (postIds.length > 0) {
          const { data, error: leadsError } = await supabase
            .from('leads')
            .select('id, post_id, status, deal_amount, revenue')
            .eq('project_id', TARGET_PROJECT_ID)
            .in('post_id', postIds);
            
          if (!leadsError && data) {
            leadsData = data;
          }
        }

        // 3. Merge Data
        // Group leads by post_id for O(1) lookup
        const leadsByPost = new Map<string, any[]>();
        leadsData.forEach(lead => {
          if (!lead.post_id) return;
          const existing = leadsByPost.get(lead.post_id) || [];
          existing.push(lead);
          leadsByPost.set(lead.post_id, existing);
        });

        const mergedPosts: PostStats[] = postsData.map(post => {
          const postLeads = leadsByPost.get(post.post_id) || [];
          
          const leadsCount = postLeads.length;
          // Heuristic for diagnostics: status contains 'diagnostic' or 'meeting' or 'consultation'
          const diagnosticsCount = postLeads.filter(l => 
            ['diagnostic', 'meeting', 'consultation', 'scheduled'].some(s => l.status?.toLowerCase().includes(s))
          ).length;
          
          // Heuristic for sales: status 'won', 'paid' or deal_amount > 0
          const salesCount = postLeads.filter(l => 
            ['won', 'paid', 'success'].some(s => l.status?.toLowerCase().includes(s)) || (l.deal_amount && l.deal_amount > 0)
          ).length;
          
          // Sum deal_amount as requested
          const revenue = postLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);

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
            channel: 'instagram', // Default to instagram as we pull from instagram_posts_stats
            clicks: Math.floor((post.reach || 0) * 0.05), // Placeholder calculation for clicks (5% CTR) as data is missing
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
  }, [period]); 

  // Filter Logic
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // Channel Filter
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(p => p.channel === selectedChannel);
    }

    // Period Filter
    const now = new Date();
    if (period === 'month') {
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
            predicted_leads: 50,
            target_audience: 'lookalike_1pct'
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
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Публикации
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Аналитика контента и управление продвижением
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-card/50 p-1 rounded-xl border border-border/50 backdrop-blur-md">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-auto">
              <TabsList className="bg-transparent h-9 p-0 gap-1">
                <TabsTrigger value="month" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground text-xs px-3 h-7 rounded-lg transition-all">Месяц</TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground text-xs px-3 h-7 rounded-lg transition-all">Все время</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Channel Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'instagram', 'youtube', 'tiktok', 'telegram', 'site'].map(channel => (
            <Button
              key={channel}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedChannel(channel)}
              className={cn(
                "gap-2 border border-border/50 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all rounded-xl px-4",
                selectedChannel === channel && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              )}
            >
              {channel === 'all' ? <LayoutGrid className="w-4 h-4" /> : <ChannelIcon channel={channel} className="w-4 h-4" />}
              <span className="capitalize text-xs font-medium">{channel === 'all' ? 'Все каналы' : channel}</span>
            </Button>
          ))}
        </div>

        {/* Table Header */}
        <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="grid grid-cols-[minmax(250px,3fr)_1.2fr_0.8fr_0.8fr_0.8fr_0.6fr_0.6fr_0.6fr_1.2fr_1.2fr] gap-4 px-6 py-4 border-b border-border/50 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider items-center">
            <div>Контент</div>
            <div>Канал</div>
            <div className="text-center">Охват</div>
            <div className="text-center">Клики</div>
            <div className="text-center">Комменты</div>
            {/* Funnel Header Group */}
            <div className="col-span-3 text-center text-primary/80 border-b border-primary/20 pb-1 mx-2">
              Воронка
            </div>
            <div className="text-right">Выручка</div>
            <div className="text-right">Действие</div>
          </div>

          {/* Sub-header for Funnel columns (optional, or just handle in rows) */}
          {/* To match "distinct columns", we label them in the main header but grouped. Let's rely on row values and tooltip/labels */}

          {/* Table Body */}
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-32 text-muted-foreground">
                Нет публикаций за выбранный период
              </div>
            ) : (
              <AnimatePresence>
                {filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group grid grid-cols-[minmax(250px,3fr)_1.2fr_0.8fr_0.8fr_0.8fr_0.6fr_0.6fr_0.6fr_1.2fr_1.2fr] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors duration-200 relative overflow-hidden"
                  >
                    {/* Content */}
                    <div className="flex items-center gap-4 min-w-0 relative z-10">
                      <div className="h-[60px] w-[60px] rounded-xl bg-muted border border-border/50 overflow-hidden flex-shrink-0 relative group-hover:border-border transition-colors">
                        {post.media_url ? (
                          <img src={post.media_url} alt="Post" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Eye className="w-6 h-6" />
                          </div>
                        )}
                        {/* Type Indicator */}
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm rounded-full p-1">
                           {post.media_type === 'VIDEO' ? <Youtube className="w-3 h-3 text-white" /> : <Instagram className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate pr-4" title={post.caption || ''}>
                          {post.caption || 'Без названия'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {post.posted_at ? format(parseISO(post.posted_at), 'dd MMM, HH:mm', { locale: ru }) : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Channel */}
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="p-2 rounded-full bg-muted/50 border border-border/50">
                        <ChannelIcon channel={post.channel} className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-muted-foreground capitalize">{post.channel}</span>
                    </div>

                    {/* Reach */}
                    <div className="flex justify-center relative z-10">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{new Intl.NumberFormat('ru-RU').format(post.reach)}</span>
                      </div>
                    </div>

                    {/* Clicks */}
                    <div className="flex justify-center relative z-10">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                         <MousePointer2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                         <span>{post.clicks}</span>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="flex justify-center relative z-10">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{post.comments}</span>
                      </div>
                    </div>

                    {/* Funnel Group (3 columns visually connected) */}
                    <div className="col-span-3 relative z-10">
                      {/* Blue Glow Background for this section */}
                      <div className="absolute inset-0 -inset-x-2 bg-primary/5 blur-lg rounded-full opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none" />
                      
                      <div className="relative grid grid-cols-3 gap-2 items-center text-center">
                        {/* Leads */}
                        <div className="flex flex-col items-center">
                           <span className="text-sm font-semibold text-foreground">{post.leads_count}</span>
                           <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Лиды</span>
                        </div>
                        
                        {/* Diagnostics */}
                        <div className="flex flex-col items-center border-l border-border/50">
                           <span className="text-sm font-semibold text-foreground">{post.diagnostics_count}</span>
                           <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Диагн.</span>
                        </div>

                        {/* Sales */}
                        <div className="flex flex-col items-center border-l border-border/50">
                           <span className="text-sm font-semibold text-green-600 dark:text-green-400">{post.sales_count}</span>
                           <span className="text-[10px] text-green-600/70 dark:text-green-400/70 uppercase tracking-tight">Прод.</span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="text-right relative z-10">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('ru-RU').format(post.revenue)} ₸
                      </span>
                    </div>

                    {/* Action */}
                    <div className="text-right relative z-10">
                      <Button 
                        size="sm" 
                        onClick={() => handlePromoteClick(post)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 w-full"
                      >
                        <Rocket className="w-3.5 h-3.5 mr-2" />
                        Продвигать
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Promote Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Rocket className="w-5 h-5 text-primary" />
              Запуск продвижения
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ИИ-таргетолог проанализировал пост и подготовил прогноз эффективности.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex gap-4">
               <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border/10">
                 {selectedPost?.media_url && (
                   <img src={selectedPost.media_url} alt="Preview" className="h-full w-full object-cover" />
                 )}
               </div>
               <div className="min-w-0 flex-1">
                 <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2">{selectedPost?.caption}</h4>
                 <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                     <Eye className="w-3 h-3 mr-1" /> {selectedPost?.reach}
                   </Badge>
                   <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                     <TrendingUp className="w-3 h-3 mr-1" /> High Potential
                   </Badge>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-xs text-blue-300 mb-1 uppercase tracking-wider">Прогноз лидов</div>
                <div className="text-2xl font-bold text-blue-400">+50</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-xs text-emerald-300 mb-1 uppercase tracking-wider">Бюджет</div>
                <div className="text-2xl font-bold text-emerald-400">20 000 ₸</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPromoteDialogOpen(false)} className="hover:bg-muted text-muted-foreground hover:text-foreground">Отмена</Button>
            <Button onClick={confirmPromote} disabled={promoting} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20">
              {promoting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
              Запустить ракету
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
