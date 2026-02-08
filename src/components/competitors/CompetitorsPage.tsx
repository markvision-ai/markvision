import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    Instagram,
    TrendingUp,
    Target,
    Zap,
    Clock,
    Eye,
    MessageCircle,
    Share2,
    Sparkles,
    ChevronRight,
    Loader2,
    ExternalLink,
    Trash2,
    History,
    Activity,
    BarChart3
} from 'lucide-react';
import { useCompetitors, Competitor, CompetitorPost } from '@/hooks/useCompetitors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface CompetitorsPageProps {
    projectId: string;
}

export const CompetitorsPage = ({ projectId }: CompetitorsPageProps) => {
    const { competitors, posts, loading, addCompetitor, removeCompetitor } = useCompetitors(projectId);
    const [newHandle, setNewHandle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | 'all'>('all');

    const filteredPosts = useMemo(() => {
        if (selectedCompetitorId === 'all') return posts;
        return posts.filter(p => p.competitor_id === selectedCompetitorId);
    }, [posts, selectedCompetitorId]);

    const handleAdd = async () => {
        if (!newHandle.trim()) return;

        setIsAdding(true);
        // Simple platform detection for demo
        const platform = newHandle.includes('tiktok') ? 'tiktok' : 'instagram';
        const handle = newHandle.replace(/@|https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\/|(\/)?$/, '');

        const result = await addCompetitor(platform, handle);
        setIsAdding(false);

        if (result) {
            setNewHandle('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#030712] text-white overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            {/* Futuristic CMD Panel */}
            <div className="relative z-20 px-8 py-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <div className="max-w-5xl mx-auto flex items-center gap-6">
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                            Мониторинг
                        </h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">NEURAL SURVEILLANCE v2</p>
                    </div>

                    <div className="flex-1 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-100 blur transition duration-500 group-hover:duration-200" />
                        <div className="relative flex items-center bg-[#0d0d0d] border border-white/10 rounded-2xl p-1.5 pl-4 h-14 shadow-2xl">
                            <Search className="w-5 h-5 text-muted-foreground mr-3" />
                            <input
                                type="text"
                                placeholder="Вставьте ссылку или @username конкурента..."
                                value={newHandle}
                                onChange={(e) => setNewHandle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
                            />
                            <Button
                                onClick={handleAdd}
                                disabled={isAdding || !newHandle.trim()}
                                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/20 px-6"
                            >
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ДОБАВИТЬ'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="max-w-7xl mx-auto px-8 py-10 space-y-12">

                    {/* Competitors Bento Horizontal */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                                <Target className="w-4 h-4" /> ОБЪЕКТЫ НАБЛЮДЕНИЯ
                            </h3>
                            <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-mono">
                                LIVE NODES: {competitors.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div
                                onClick={() => setSelectedCompetitorId('all')}
                                className={cn(
                                    "p-4 rounded-3xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden relative group",
                                    selectedCompetitorId === 'all'
                                        ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                        : "bg-white/[0.03] border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1">
                                    <Activity className={cn("w-6 h-6", selectedCompetitorId === 'all' ? "text-indigo-400" : "text-white/40")} />
                                </div>
                                <span className="text-sm font-bold">Все объекты</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">Unified Feed</span>
                            </div>

                            {competitors.map((comp) => (
                                <div
                                    key={comp.id}
                                    onClick={() => setSelectedCompetitorId(comp.id)}
                                    className={cn(
                                        "group p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md",
                                        selectedCompetitorId === comp.id
                                            ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                            : "bg-white/[0.03] border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-white/10 group-hover:border-indigo-500/50 transition-colors">
                                            <AvatarImage src={comp.avatar_url || ''} />
                                            <AvatarFallback className="bg-white/5 text-lg">
                                                {comp.handle[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">@{comp.handle}</p>
                                            <div className="flex items-center gap-1.5">
                                                {comp.platform === 'instagram' ? <Instagram className="w-3 h-3 text-pink-500" /> : <MessageCircle className="w-3 h-3 text-cyan-400" />}
                                                <span className="text-[10px] text-muted-foreground uppercase font-mono">Active</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeCompetitor(comp.id);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    {/* Status Bar */}
                                    <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-muted-foreground/60 uppercase">
                                        <span>Scan: {comp.last_scanned_at ? format(new Date(comp.last_scanned_at), 'HH:mm') : '—'}</span>
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Viral Feed Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    Анализ активности (24ч)
                                </h2>
                                <p className="text-xs text-muted-foreground">Искусственный интеллект отобрал самые эффективные посты ваших конкурентов</p>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-1 border border-white/10">
                                <Button size="sm" variant="ghost" className="rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-white/10">Сегодня</Button>
                                <Button size="sm" variant="ghost" className="rounded-xl text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Неделя</Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse border border-white/10" />
                                ))}
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <Zap className="w-8 h-8 text-white/20" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Активности не обнаружено</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    Конкуренты пока не опубликовали новых постов. Мы пришлем уведомление, когда появится свежий контент.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredPosts.map((post) => (
                                    <ViralPostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

const ViralPostCard = ({ post }: { post: CompetitorPost }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);

    const handleAdapt = () => {
        setIsRewriting(true);
        // Simulate AI adaptation
        setTimeout(() => {
            setIsRewriting(false);
            toast.success('Пост адаптирован и отправлен в Content Factory!');
        }, 2000);
    }

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border transition-all duration-700 backdrop-blur-xl",
                post.virality_score > 85
                    ? "border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/20"
                    : "border-white/10 shadow-2xl"
            )}
        >
            {/* Golden Glow for Viral Posts */}
            {post.virality_score > 85 && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-[60px] pointer-events-none" />
            )}

            {/* Main Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={post.thumbnail_url || post.media_url || ''}
                    alt="Post content"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end">
                {/* Top Badges */}
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                    <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                        {post.platform}
                    </Badge>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 text-yellow-400 text-[10px] font-bold">
                        <Zap className="w-3 h-3 fill-yellow-400" />
                        {post.virality_score}% VIRALITY
                    </div>
                </div>

                {/* Caption Snippet */}
                <p className="text-sm font-medium line-clamp-2 text-white/90 mb-6 group-hover:line-clamp-none transition-all duration-500 h-10 group-hover:h-auto">
                    {post.caption}
                </p>

                {/* Metrics Bar - JetBrains Mono */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-white/10 font-mono">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase opacity-60">REACH</span>
                        <span className="text-sm font-bold text-indigo-400">
                            {new Intl.NumberFormat('en', { notation: 'compact' }).format(post.reach)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase opacity-60">CMNTS</span>
                        <span className="text-sm font-bold text-white">
                            {new Intl.NumberFormat('en', { notation: 'compact' }).format(post.comments_count)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[10px] text-muted-foreground uppercase opacity-60">SHRS</span>
                        <span className="text-sm font-bold text-purple-400">
                            {new Intl.NumberFormat('en', { notation: 'compact' }).format(post.reposts_count)}
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleAdapt}
                    disabled={isRewriting}
                    className="w-full mt-4 h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-bold tracking-tight text-xs uppercase overflow-hidden relative group/btn"
                >
                    {isRewriting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <div className="flex items-center gap-2 relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            АДАПТИРОВАТЬ И ПЕРЕПИСАТЬ
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                </Button>
            </div>

            {/* Hover Reveal Details */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 flex flex-col pointer-events-none group-hover:pointer-events-auto translate-y-4 group-hover:translate-y-0">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                        AI
                    </div>
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider">Анализ стратегии</h4>
                        <p className="text-[10px] text-muted-foreground font-mono">NEURAL INSIGHT ENGINE</p>
                    </div>
                </div>

                <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Почему это работает</p>
                        <p className="text-sm text-white/80 leading-relaxed italic">
                            "Используется прием 'контрастного сторителлинга' с быстрым монтажом. Крючок (hook) на 2-й секунде удерживает 80% аудитории."
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Гипотеза для вас</p>
                        <p className="text-sm text-white/80 leading-relaxed">
                            Адаптируйте этот формат под вашу нишу медицины, используя аналогичный темп речи и графические вставки.
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto rounded-xl border-white/10 hover:bg-white/5 gap-2 uppercase text-[10px] font-bold tracking-widest h-10"
                    onClick={() => window.open(post.media_url || '', '_blank')}
                >
                    <ExternalLink className="w-3.5 h-3.5" /> СМОТРЕТЬ ОРИГИНАЛ
                </Button>
            </div>
        </motion.div>
    );
};
