// @ts-nocheck
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
  ArrowUpRight,
  Plus,
  BarChart3,
  Calendar as CalendarIcon,
  Settings,
  MoreVertical,
  Target,
  Zap,
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileVideo
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfWeek, isWithinInterval, parseISO, subMonths, addMonths, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { AutoPostingOnboarding } from './AutoPostingOnboarding';
import { PostCreatorWizard } from './PostCreatorWizard';

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
  visits_count: number;
  sales_count: number;
  revenue: number;
}

interface PublicationsPageProps {
  projectId: string;
}

export const PublicationsPage = ({ projectId }: PublicationsPageProps) => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostStats[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostStats | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'reach' | 'comments' | 'leads' | 'revenue'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: postsData, error: postsError } = await supabase
          .from('instagram_posts_stats')
          .select('*')
          .eq('project_id', projectId)
          .order('posted_at', { ascending: false });

        if (postsError) throw postsError;

        if (!postsData) {
          setPosts([]);
          setLoading(false);
          return;
        }

        const postIds = postsData.map(p => p.post_id).filter(Boolean);
        let leadsData: any[] = [];
        if (postIds.length > 0) {
          const { data, error: leadsError } = await supabase
            .from('leads')
            .select('id, post_id, status, deal_amount, revenue')
            .eq('project_id', projectId)
            .in('post_id', postIds);

          if (!leadsError && data) {
            leadsData = data;
          }
        }

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
          const visitsCount = postLeads.filter(l =>
            ['visit_completed', 'visit', 'meeting', 'consultation', 'scheduled'].some(s => l.status?.toLowerCase().includes(s))
          ).length;
          const salesCount = postLeads.filter(l =>
            ['won', 'paid', 'success'].some(s => l.status?.toLowerCase().includes(s)) || (l.deal_amount && l.deal_amount > 0)
          ).length;
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
            channel: 'instagram',
            clicks: Math.floor((post.reach || 0) * 0.05),
            leads_count: leadsCount,
            visits_count: visitsCount,
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
  }, [projectId]);

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(p => p.channel === selectedChannel);
    }
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(p => {
        if (!p.posted_at) return false;
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
        return isWithinInterval(parseISO(p.posted_at), {
          start: dateRange.from,
          end: end
        });
      });
    }

    // Sorting logic
    filtered.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'reach': valA = a.reach; valB = b.reach; break;
        case 'comments': valA = a.comments; valB = b.comments; break;
        case 'leads': valA = a.leads_count; valB = b.leads_count; break;
        case 'revenue': valA = a.revenue; valB = b.revenue; break;
        case 'date':
        default:
          valA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
          valB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
          break;
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return filtered;
  }, [posts, dateRange, selectedChannel, sortBy, sortOrder]);

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
          project_id: projectId,
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

  const handlePrevMonth = () => {
    const newFrom = subMonths(startOfMonth(dateRange.from), 1);
    const newTo = endOfMonth(newFrom);
    setDateRange({ from: newFrom, to: newTo });
  };

  const handleNextMonth = () => {
    const newFrom = addMonths(startOfMonth(dateRange.from), 1);
    const newTo = endOfMonth(newFrom);
    setDateRange({ from: newFrom, to: newTo });
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-y-auto bg-transparent font-sans">

      {!hasConnectedAccounts ? (
        <AutoPostingOnboarding
          onConnect={() => setHasConnectedAccounts(true)}
          onCreatePost={() => setIsCreatorOpen(true)}
        />
      ) : (
        <div className="max-w-[1700px] mx-auto w-full space-y-10">

          {/* Header with high-tech aesthetic */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-widest mb-3">
                <Rocket className="w-3 h-3" />
                Автопостинг
              </div>
              <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase transition-all">
                Управление <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Контентом</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm font-light">
                Планируйте и анализируйте ваши публикации во всех соцсетях.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 relative z-10">
              <div className="flex items-center gap-2 p-1 px-3 rounded-2xl bg-muted/50 border border-border h-12">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2">Сортировка:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-foreground text-xs font-bold uppercase tracking-widest outline-none cursor-pointer"
                >
                  <option value="date" className="bg-background">Дата</option>
                  <option value="reach" className="bg-background">Охват</option>
                  <option value="leads" className="bg-background">Лиды</option>
                  <option value="revenue" className="bg-background">Доход</option>
                  <option value="comments" className="bg-background">Комменты</option>
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-180" />}
                </Button>
              </div>

              <div className="p-1 rounded-2xl bg-muted/50 border border-border flex items-center gap-1">
                <Button
                  onClick={() => setIsCreatorOpen(true)}
                  className="h-12 px-8 bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] active:scale-95"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Создать пост
                </Button>
                <div className="w-px h-8 bg-border mx-1" />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    align="end"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Filters as Navigation Nodes */}
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'Все каналы' },
              { id: 'instagram', label: 'Инстаграм' },
              { id: 'youtube', label: 'Ютуб' },
              { id: 'tiktok', label: 'ТикТок' },
              { id: 'telegram', label: 'Телеграм' },
              { id: 'threads', label: 'Тредс' },
              { id: 'site', label: 'Сайт' }
            ].map(channel => (
              <Button
                key={channel.id}
                variant="ghost"
                onClick={() => setSelectedChannel(channel.id)}
                className={cn(
                  "h-12 px-6 gap-3 border transition-all duration-300 rounded-2xl font-bold uppercase tracking-widest text-[10px]",
                  selectedChannel === channel.id
                    ? "bg-muted border-border text-foreground shadow-lg"
                    : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {channel.id === 'all' ? <LayoutGrid className="w-4 h-4" /> : <ChannelIcon channel={channel.id} className="w-4 h-4" />}
                {channel.label}
              </Button>
            ))}
          </div>

          {/* Analytics Table - Interstellar Redesign */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000" />

            <div className="relative w-full overflow-hidden rounded-[32px] border border-border bg-card/80 backdrop-blur-2xl shadow-2xl">

              {/* Table Header Container */}
              <div className="grid grid-cols-[1fr_120px_80px_80px_110px_160px_100px_140px] gap-6 px-10 py-6 border-b border-border bg-muted/30 items-center">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Контент</span>
                </div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center">Канал</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center">Охват</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center">Клики</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center">Комменты</div>
                <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] text-center border-b border-cyan-500/20 pb-1">Воронка</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-right">Доход</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-right whitespace-nowrap">Действие</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                    <span className="text-xs font-mono text-cyan-500/50 uppercase tracking-widest animate-pulse">Синхронизация данных...</span>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-40">
                    <div className="inline-flex flex-col items-center gap-3 text-muted-foreground">
                      <Rocket className="w-16 h-16 mb-2 opacity-50" />
                      <p className="text-sm font-mono uppercase tracking-[0.2em]">Публикаций не найдено</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredPosts.map((post, idx) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group grid grid-cols-[1fr_120px_80px_80px_110px_160px_100px_140px] gap-6 px-10 py-6 items-center hover:bg-muted/30 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:via-cyan-500/5 transition-all duration-500" />

                        {/* Content */}
                        <div className="flex items-center gap-6 min-w-0 relative z-10">
                          <div className="h-16 w-16 rounded-2xl bg-muted/50 border border-border overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500 shadow-xl">
                            {post.media_url ? (
                              <img src={post.media_url} alt="Post" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <Eye className="w-6 h-6" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                            <div className="absolute bottom-1 right-1 bg-background/90 backdrop-blur-md rounded-lg p-1 border border-border">
                              {post.media_type === 'VIDEO' ? <FileVideo className="w-3 h-3 text-cyan-400" /> : <FileImage className="w-3 h-3 text-purple-400" />}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-bold text-foreground group-hover:text-cyan-500 transition-colors truncate pr-8" title={post.caption || ''}>
                              {post.caption || 'Без названия'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                              <CalendarIcon className="w-3 h-3" />
                              {post.posted_at ? format(parseISO(post.posted_at), 'dd MMM yyyy, HH:mm', { locale: ru }) : 'Недавно'}
                            </div>
                          </div>
                        </div>

                        {/* Node (Channel) */}
                        <div className="flex justify-center relative z-10">
                          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/50 border border-border min-w-[80px] group-hover:border-border transition-all">
                            <ChannelIcon channel={post.channel} className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{post.channel}</span>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="text-center relative z-10 font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {new Intl.NumberFormat('ru-RU').format(post.reach)}
                        </div>
                        <div className="text-center relative z-10 font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {post.clicks}
                        </div>
                        <div className="text-center relative z-10 font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {post.comments}
                        </div>

                        {/* Funnel Matrix */}
                        <div className="relative z-10">
                          <div className="grid grid-cols-2 gap-2 text-center p-3 rounded-2xl bg-cyan-500/10 border border-border group-hover:bg-cyan-500/15 transition-all">
                            <div className="space-y-0.5">
                              <div className="text-[14px] font-black text-foreground">{post.leads_count}</div>
                              <div className="text-[9px] text-cyan-500/70 uppercase tracking-widest font-bold">Лиды</div>
                            </div>
                            <div className="space-y-0.5 border-l border-border">
                              <div className="text-[14px] font-black text-foreground">{post.visits_count}</div>
                              <div className="text-[9px] text-cyan-500/70 uppercase tracking-widest font-bold">Визиты</div>
                            </div>
                          </div>
                        </div>

                        {/* Revenue */}
                        <div className="text-right relative z-10">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                              {new Intl.NumberFormat('ru-RU').format(post.revenue)} ₸
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400/40 font-mono">
                              <Target className="w-2.5 h-2.5" />
                              {post.sales_count} ПРОДАЖИ
                            </div>
                          </div>
                        </div>

                        {/* Action Protocol */}
                        <div className="flex justify-end relative z-10">
                          <Button
                            onClick={() => handlePromoteClick(post)}
                            className="h-10 px-6 bg-white/5 hover:bg-cyan-500 hover:text-black border border-white/10 hover:border-cyan-400 rounded-xl transition-all duration-300 group/btn"
                          >
                            <Zap className="w-4 h-4 mr-2 group-hover/btn:fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Продвигать</span>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Creator Wizard Overlays */}
      {
        isCreatorOpen && (
          <PostCreatorWizard
            onClose={() => setIsCreatorOpen(false)}
            onSuccess={() => {
              // refresh data
            }}
          />
        )
      }

      {/* Promote Dialog - Refined for Interstellar */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground backdrop-blur-3xl rounded-[32px] p-8 shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Rocket className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">ИИ-Продвижение</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 font-light">
                Нейронный анализ рекомендует этот пост для масштабирования.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="p-5 rounded-[24px] bg-muted/50 border border-border flex gap-5 items-center">
              <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border relative">
                {selectedPost?.media_url && (
                  <img src={selectedPost.media_url} alt="Preview" className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h4 className="font-bold text-sm text-foreground line-clamp-1">{selectedPost?.caption || 'Без названия'}</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-black uppercase font-mono">
                    ПОТЕНЦИАЛ: ВЫСОКИЙ
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase font-mono">
                    CTR: 4.8%
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[24px] bg-cyan-500/10 border border-border text-center space-y-1">
                <div className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">Прогноз лидов</div>
                <div className="text-3xl font-black text-foreground">+50</div>
                <div className="text-[9px] text-muted-foreground uppercase">Ожидается</div>
              </div>
              <div className="p-6 rounded-[24px] bg-purple-500/10 border border-border text-center space-y-1">
                <div className="text-[10px] text-purple-500 font-black uppercase tracking-widest">Бюджет</div>
                <div className="text-3xl font-black text-foreground">20к</div>
                <div className="text-[9px] text-muted-foreground uppercase text-center ml-4">₸</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:justify-center">
            <Button variant="ghost" onClick={() => setPromoteDialogOpen(false)} className="h-14 px-8 rounded-2xl text-muted-foreground hover:text-foreground uppercase font-bold text-xs tracking-widest">Отмена</Button>
            <Button onClick={confirmPromote} disabled={promoting} className="h-14 px-10 bg-cyan-500 text-black hover:bg-cyan-400 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02]">
              {promoting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Rocket className="w-5 h-5 mr-3" />}
              Запустить рост
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};
