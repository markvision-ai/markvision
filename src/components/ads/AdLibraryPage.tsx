import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Instagram,
    Facebook,
    Play,
    Bookmark,
    ExternalLink,
    Eye,
    MoreHorizontal,
    Calendar,
    Globe,
    ChevronDown,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdCard {
    id: string;
    status: 'active' | 'inactive';
    startDate: string;
    platforms: ('instagram' | 'facebook')[];
    author: {
        name: string;
        avatar: string;
    };
    text: string;
    mediaType: 'video' | 'image';
    mediaPlaceholder: string;
}

const MOCK_ADS: AdCard[] = [
    {
        id: '1',
        status: 'active',
        startDate: '15 фев 2026 г.',
        platforms: ['instagram', 'facebook'],
        author: {
            name: 'Клиника AIVA',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AIVA&backgroundColor=059669'
        },
        text: 'Страдаете от сколиоза? 🌀 Я, доктор Мурат, делюсь своей авторской методикой! 💪 Присоединяйтесь к нам для улучшения осанки и избавления от болей в спине. 🏥Приходите в нашу клинику!',
        mediaType: 'video',
        mediaPlaceholder: 'bg-emerald-500/10'
    },
    {
        id: '2',
        status: 'active',
        startDate: '18 фев 2026 г.',
        platforms: ['instagram'],
        author: {
            name: 'Dental Studio Elite',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DS&backgroundColor=955251'
        },
        text: 'Имплантация зубов "под ключ" с гарантией 10 лет! ✨ Верните себе уверенную улыбку за 1 визит. Только до конца месяца консультация хирурга — бесплатно! 🦷',
        mediaType: 'image',
        mediaPlaceholder: 'bg-blue-500/10'
    },
    {
        id: '3',
        status: 'inactive',
        startDate: '10 фев 2026 г.',
        platforms: ['facebook'],
        author: {
            name: 'Beauty Med Center',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=BM&backgroundColor=6366f1'
        },
        text: 'Омоложение лица без операций! 🌟 Узнайте о новейших методиках SMAS-лифтинга в нашей клинике. Запишитесь на пробную процедуру со скидкой 30% прямо сейчас!',
        mediaType: 'video',
        mediaPlaceholder: 'bg-purple-500/10'
    }
];

export const AdLibraryPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'search' | 'monitoring'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 pb-24 lg:p-10">
            {/* Header Area */}
            <div className="max-w-[1600px] mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter uppercase tracking-[0.05em]">
                            Библиотека <span className="text-emerald-400">рекламы</span>
                        </h1>
                        <p className="text-white/40 text-sm font-medium">Мониторинг и анализ креативов конкурентов в реальном времени</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                activeTab === 'search'
                                    ? "bg-emerald-400 text-[#09090b] shadow-lg shadow-emerald-400/20"
                                    : "text-white/40 hover:text-white"
                            )}
                        >
                            Поиск рекламы
                        </button>
                        <button
                            onClick={() => setActiveTab('monitoring')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                activeTab === 'monitoring'
                                    ? "bg-emerald-400 text-[#09090b] shadow-lg shadow-emerald-400/20"
                                    : "text-white/40 hover:text-white"
                            )}
                        >
                            Мониторинг конкурентов
                        </button>
                    </div>
                </div>

                {activeTab === 'search' ? (
                    <>
                        {/* Search & Filter Bar */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 relative group">
                                <div className="absolute inset-0 bg-emerald-400/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                                <Input
                                    placeholder="Поиск по названию страницы или рекламодателю..."
                                    className="h-16 pl-14 pr-6 bg-white/[0.03] border-white/10 rounded-2xl focus:border-emerald-400/50 focus:ring-0 text-lg placeholder:text-white/20 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <Button variant="outline" className="w-full h-16 bg-white/[0.03] border-white/10 rounded-2xl flex items-center justify-between px-6 hover:bg-white/5 hover:border-white/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Filter className="w-5 h-5 text-emerald-400" />
                                        <span className="font-bold text-sm uppercase tracking-wider text-white/60 group-hover:text-white">Фильтры</span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-white/20" />
                                </Button>
                            </div>
                            <div className="lg:col-span-2">
                                <Button className="w-full h-16 bg-emerald-400 hover:bg-emerald-300 text-[#09090b] rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-400/20">
                                    Найти
                                </Button>
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                            {MOCK_ADS.map((ad) => (
                                <motion.div
                                    key={ad.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-xl hover:border-white/20 transition-all duration-500"
                                >
                                    {/* Card Header */}
                                    <div className="p-6 pb-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                ad.status === 'active' ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-white/5 text-white/40 border border-white/10"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", ad.status === 'active' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-white/20")} />
                                                {ad.status === 'active' ? 'Активно' : 'Неактивно'}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-emerald-400 hover:border-emerald-400/30 transition-all">
                                                    <Bookmark className="w-4 h-4" />
                                                </button>
                                                <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-white/30 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Начало показа: {ad.startDate}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {ad.platforms.includes('facebook') && <Facebook className="w-3.5 h-3.5" />}
                                                {ad.platforms.includes('instagram') && <Instagram className="w-3.5 h-3.5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Author Block */}
                                    <div className="px-6 py-4 flex items-center gap-3 border-y border-white/5 bg-white/[0.01]">
                                        <img src={ad.author.avatar} alt={ad.author.name} className="w-10 h-10 rounded-full border border-white/10" />
                                        <div>
                                            <h3 className="font-bold text-sm tracking-tight">{ad.author.name}</h3>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Рекламодатель</p>
                                        </div>
                                    </div>

                                    {/* Ad Copy */}
                                    <div className="p-6 space-y-4">
                                        <p className="text-sm text-white/70 leading-relaxed line-clamp-3">
                                            {ad.text}
                                        </p>
                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300 transition-colors">
                                            Читать далее...
                                        </button>
                                    </div>

                                    {/* Media Block */}
                                    <div className="px-6 pb-6">
                                        <div className={cn(
                                            "relative aspect-[4/5] rounded-[24px] border border-white/10 overflow-hidden flex items-center justify-center group/media",
                                            ad.mediaPlaceholder
                                        )}>
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-60" />

                                            {ad.mediaType === 'video' && (
                                                <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center group-hover/media:scale-110 transition-transform duration-500 shadow-2xl">
                                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                                </div>
                                            )}

                                            <div className="absolute bottom-6 inset-x-6 flex justify-between items-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                                    {ad.mediaType === 'video' ? 'VIDEO 1080p' : 'IMAGE HD'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-6 pt-0">
                                        <Button variant="ghost" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                                            Смотреть детали
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Monitoring Tab */
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400/20">
                            <Eye className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Мониторинг конкурентов</h2>
                            <p className="text-white/40 max-w-md mx-auto">
                                Сохраняйте страницы конкурентов, чтобы автоматически отслеживать их новые рекламные кампании и изменения в стратегиях.
                            </p>
                        </div>
                        <Button className="h-14 px-10 bg-emerald-400 hover:bg-emerald-300 text-[#09090b] rounded-2xl font-black uppercase tracking-widest transition-all">
                            Добавить конкурента
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdLibraryPage;
