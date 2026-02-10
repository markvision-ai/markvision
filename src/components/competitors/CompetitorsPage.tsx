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
        <div className="flex flex-col h-full bg-[#030712] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Background Ambience (Exact match to Content Center) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar relative z-10">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md"
                        >
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">NEURAL SURVEILLANCE</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
                            ЦЕНТР <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">НАБЛЮДЕНИЯ</span>
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
                            Мониторинг активности конкурентов в реальном времени.
                            AI анализирует стратегии, виральность и тренды 24/7.
                        </p>
                    </div>

                    {/* Command Input Area */}
                    <div className="max-w-2xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />

                        <div className="relative bg-[#0d0d0d] border border-white/5 rounded-[1.5rem] p-2 flex items-center shadow-2xl overflow-hidden backdrop-blur-3xl">
                            <div className="flex-1 flex items-center px-4 relative z-10">
                                <Search className="w-5 h-5 text-muted-foreground/50 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Добавить цель: Instagram/TikTok ссылка или @username..."
                                    value={newHandle}
                                    onChange={(e) => setNewHandle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    className="w-full bg-transparent border-none outline-none text-base font-mono text-white placeholder:text-muted-foreground/30 h-12"
                                />
                            </div>

                            <Button
                                onClick={handleAdd}
                                disabled={isAdding || !newHandle.trim()}
                                className="h-12 rounded-xl px-8 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border-0 font-bold uppercase tracking-widest text-xs relative overflow-hidden group/btn shadow-[0_0_20px_rgba(8,145,178,0.3)]"
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                                    SCAN
                                </div>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            </Button>
                        </div>

                        {/* Platform Icons */}
                        <div className="mt-4 flex items-center justify-center gap-6 opacity-40">
                            <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default">
                                <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_5px_pink]" />
                                <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Instagram</span>
                            </div>
                            <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_cyan]" />
                                <span className="text-[9px] font-bold uppercase tracking-widest font-mono">TikTok</span>
                            </div>
                        </div>
                    </div>

                    {/* Competitors List & Stats */}
                    <div className="space-y-8">
                        {/* Header for List */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Активные цели
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-mono text-emerald-400">SYSTEM ONLINE</span>
                            </div>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* All Feed Card */}
                            <motion.div
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(6, 182, 212, 0.05)" }}
                                onClick={() => setSelectedCompetitorId('all')}
                                className={cn(
                                    "p-6 rounded-3xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-4 relative overflow-hidden group",
                                    selectedCompetitorId === 'all'
                                        ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                                        : "bg-[#0A0F1E]/40 border-white/5 hover:border-white/20 backdrop-blur-md"
                                )}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                                    selectedCompetitorId === 'all'
                                        ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] rotate-3 scale-110"
                                        : "bg-white/5 text-white/40 group-hover:bg-cyan-500/20 group-hover:text-cyan-400"
                                )}>
                                    <BarChart3 className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-white mb-1">Общая лента</span>
                                    <span className="text-[10px] text-cyan-300/60 uppercase font-mono tracking-widest">Global Stream</span>
                                </div>
                            </motion.div>

                            <AnimatePresence mode="popLayout">
                                {competitors.map((comp) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={comp.id}
                                        onClick={() => setSelectedCompetitorId(comp.id)}
                                        className={cn(
                                            "group p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl",
                                            selectedCompetitorId === comp.id
                                                ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)] ring-1 ring-cyan-500/20"
                                                : "bg-[#0A0F1E]/40 border-white/5 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)]"
                                        )}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400 rounded-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeCompetitor(comp.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="flex flex-col items-center text-center gap-4 mt-2">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                                <Avatar className="h-20 w-20 border-2 border-white/10 group-hover:border-cyan-500 transition-all duration-300 shadow-2xl">
                                                    <AvatarImage src={comp.avatar_url || ''} />
                                                    <AvatarFallback className="bg-[#1a1f2e] text-2xl font-bold text-cyan-300">
                                                        {comp.handle[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-2 -right-2 p-1.5 bg-[#030712] rounded-full border border-white/10">
                                                    {comp.platform === 'instagram' ? (
                                                        <Instagram className="w-4 h-4 text-pink-500" />
                                                    ) : comp.platform === 'tiktok' ? (
                                                        <span className="w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-white text-black rounded-sm">TT</span>
                                                    ) : (
                                                        <MessageCircle className="w-4 h-4 text-cyan-400" />
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">@{comp.handle}</h4>
                                                <div className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider border",
                                                    comp.status === 'error' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                        "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                )}>
                                                    {comp.status === 'error' ? 'CONNECTION LOST' : 'MONITORING ACTIVE'}
                                                </div>
                                            </div>

                                            <div className="w-full grid grid-cols-3 gap-2 py-3 border-t border-white/5 mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-white/30 uppercase">Posts</span>
                                                    <span className="text-xs font-mono font-bold">{comp.posts_count || 0}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-white/5">
                                                    <span className="text-[10px] text-white/30 uppercase">Followers</span>
                                                    <span className="text-xs font-mono font-bold text-cyan-300">
                                                        {new Intl.NumberFormat('en', { notation: 'compact' }).format(comp.followers_count || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col border-l border-white/5">
                                                    <span className="text-[10px] text-white/30 uppercase">Last</span>
                                                    <span className="text-xs font-mono font-bold text-emerald-400/80">2m</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Viral Feed Section */}
                    <section className="space-y-6 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                                    <Zap className="w-5 h-5 fill-yellow-500" />
                                </span>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                                    Виральный контент
                                </span>
                            </h2>
                            <div className="flex items-center gap-2 bg-[#0A0F1E] p-1 rounded-xl border border-white/10">
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold hover:bg-white/10">24H</Button>
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold text-white/40 hover:text-white hover:bg-white/10">7D</Button>
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold text-white/40 hover:text-white hover:bg-white/10">30D</Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
                                ))}
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                    <Zap className="w-10 h-10 text-white/10" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white/60">Сканирование эфира...</h3>
                                <p className="text-sm text-cyan-300/40 max-w-sm mx-auto font-mono">
                                    Ожидание входящих сигналов от целей наблюдения. Данные появятся автоматически.
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
        setTimeout(() => {
            setIsRewriting(false);
            toast.success('Пост адаптирован и отправлен в Content Factory!');
        }, 2000);
    }

    return (
        <motion.div
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border transition-all duration-500",
                post.virality_score > 85
                    ? "border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.1)] hover:border-yellow-500/50"
                    : "border-white/10 hover:border-white/20"
            )}
        >
            {/* Image & Gradient */}
            <div className="absolute inset-0 z-0 bg-[#0A0F1E]">
                <img
                    src={post.thumbnail_url || post.media_url || ''}
                    alt="Post content"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/60 to-transparent" />
            </div>

            {/* Metrics Overlay */}
            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end">
                <div className="absolute top-6 right-6">
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold shadow-lg",
                        post.virality_score > 80
                            ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                            : "bg-white/10 border-white/10 text-white"
                    )}>
                        <Zap className={cn("w-3.5 h-3.5", post.virality_score > 80 && "fill-yellow-400")} />
                        {post.virality_score}% VIRAL
                    </div>
                </div>

                <div className="transform transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] uppercase tracking-wider backdrop-blur-sm">
                            {post.platform}
                        </Badge>
                        <span className="text-[10px] text-white/40 font-mono">
                            {format(new Date(post.published_at), 'dd MMM HH:mm')}
                        </span>
                    </div>

                    <p className="text-sm font-medium leading-relaxed text-white/90 line-clamp-2 mb-4 group-hover:line-clamp-none transition-all">
                        {post.caption}
                    </p>

                    <div className="grid grid-cols-3 gap-2 py-4 border-t border-white/10">
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Reach</p>
                            <p className="text-sm font-bold font-mono text-indigo-300">
                                {new Intl.NumberFormat('en', { notation: 'compact' }).format(post.reach)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Likes</p>
                            <p className="text-sm font-bold font-mono text-white">
                                {new Intl.NumberFormat('en', { notation: 'compact' }).format(post.likes_count)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Score</p>
                            <p className="text-sm font-bold font-mono text-emerald-400">{post.virality_score}</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleAdapt}
                        disabled={isRewriting}
                        className="w-full h-11 rounded-xl bg-white text-black hover:bg-indigo-50 font-bold text-xs uppercase tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                        {isRewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Адаптировать идею
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};
