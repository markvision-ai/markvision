import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAgencyAnalytics } from '@/hooks/useAgencyAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, CalendarDays, ChevronDown, CheckCircle2, Activity, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const FB_API = 'https://graph.facebook.com/v22.0';
const LEAD_TYPES = ['onsite_conversion.lead_grouped', 'onsite_conversion.messaging_conversation_started_7d'];

interface FbCampaign {
    id: string;
    name: string;
    status: string;
    effective_status: string;
    daily_budget?: string;
    lifetime_budget?: string;
    insights?: {
        data: Array<{
            spend: string;
            impressions: string;
            clicks: string;
            cpm: string;
            ctr: string;
            actions?: Array<{ action_type: string; value: string }>;
        }>;
    };
}

const AccountCampaigns = ({ accountId, fbToken }: { accountId: string; fbToken: string }) => {
    const [campaigns, setCampaigns] = useState<FbCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<Record<string, boolean>>({});

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const url = `${FB_API}/act_${accountId}/campaigns?fields=id,name,status,effective_status,daily_budget,lifetime_budget,insights.date_preset(today){spend,impressions,clicks,cpm,ctr,actions}&limit=50&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]&access_token=${fbToken}`;
            const resp = await fetch(url);
            const json = await resp.json();
            if (json.error) throw new Error(json.error.message);
            setCampaigns(json.data || []);
        } catch (e: any) {
            toast.error(`Ошибка загрузки кампаний: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [accountId, fbToken]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const toggleCampaign = async (campaign: FbCampaign) => {
        const newStatus = campaign.effective_status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        setToggling(prev => ({ ...prev, [campaign.id]: true }));
        try {
            const resp = await fetch(`${FB_API}/${campaign.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, access_token: fbToken }),
            });
            const json = await resp.json();
            if (json.error) throw new Error(json.error.message);
            toast.success(`${campaign.name}: ${newStatus === 'ACTIVE' ? 'запущена' : 'поставлена на паузу'}`);
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: newStatus, effective_status: newStatus } : c));
        } catch (e: any) {
            toast.error(`Ошибка: ${e.message}`);
        } finally {
            setToggling(prev => ({ ...prev, [campaign.id]: false }));
        }
    };

    const getLeads = (campaign: FbCampaign) => {
        const actions = campaign.insights?.data?.[0]?.actions || [];
        return actions.filter(a => LEAD_TYPES.includes(a.action_type)).reduce((s, a) => s + Number(a.value), 0);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-8 gap-2 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Загрузка кампаний из Meta...</span>
        </div>
    );

    if (!campaigns.length) return (
        <div className="py-6 text-center text-white/30 text-sm">Нет активных или приостановленных кампаний</div>
    );

    return (
        <div className="px-2 pb-3">
            <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-black uppercase tracking-widest text-white/30">
                    Кампании ({campaigns.length})
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-white/40 hover:text-white/70 text-xs" onClick={fetchCampaigns}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Обновить
                </Button>
            </div>
            <div className="rounded-xl border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-white/[0.02] border-b border-white/[0.02] hover:bg-white/[0.02]">
                            <TableHead className="text-white/30 font-semibold text-xs py-2 pl-4">Кампания</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-right">Бюджет/день</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-right">Расход сегодня</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-right">Показы</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-right">Клики</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-right">CTR</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-right">Лиды</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-right">CPL</TableHead>
                            <TableHead className="text-white/30 font-semibold text-xs py-2 text-center w-20">Статус</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.map(c => {
                            const ins = c.insights?.data?.[0];
                            const spend = Number(ins?.spend || 0);
                            const impressions = Number(ins?.impressions || 0);
                            const clicks = Number(ins?.clicks || 0);
                            const ctr = Number(ins?.ctr || 0);
                            const leads = getLeads(c);
                            const cpl = leads > 0 ? spend / leads : 0;
                            const budget = c.daily_budget ? Number(c.daily_budget) / 100 : null;
                            const isActive = c.effective_status === 'ACTIVE';
                            return (
                                <TableRow key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                    <TableCell className="pl-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isActive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-white/20")} />
                                            <span className="text-sm text-white/80 font-medium">{c.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-white/50 text-sm tabular-nums">
                                        {budget != null ? `$${budget.toFixed(0)}` : '—'}
                                    </TableCell>
                                    <TableCell className="text-right text-white/80 text-sm tabular-nums font-medium">
                                        {spend > 0 ? `$${spend.toFixed(2)}` : '—'}
                                    </TableCell>
                                    <TableCell className="text-right text-white/50 text-sm tabular-nums">
                                        {impressions > 0 ? impressions.toLocaleString('ru-RU') : '—'}
                                    </TableCell>
                                    <TableCell className="text-right text-white/50 text-sm tabular-nums">
                                        {clicks > 0 ? clicks : '—'}
                                    </TableCell>
                                    <TableCell className="text-right text-white/50 text-sm tabular-nums">
                                        {ctr > 0 ? `${ctr.toFixed(2)}%` : '—'}
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-bold tabular-nums">
                                        {leads > 0 ? <span className="text-green-400">{leads}</span> : <span className="text-white/30">0</span>}
                                    </TableCell>
                                    <TableCell className="text-right text-sm tabular-nums">
                                        {cpl > 0 ? (
                                            <span className={cn("font-bold", cpl < 2 ? "text-green-400" : cpl > 3 ? "text-red-400" : "text-yellow-400")}>
                                                ${cpl.toFixed(2)}
                                            </span>
                                        ) : <span className="text-white/30">—</span>}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {toggling[c.id] ? (
                                            <Loader2 className="w-4 h-4 animate-spin mx-auto text-white/40" />
                                        ) : (
                                            <Switch
                                                checked={isActive}
                                                onCheckedChange={() => toggleCampaign(c)}
                                                className={cn(isActive ? "data-[state=checked]:bg-green-500" : "")}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export const AgencyAccountsDashboard = ({ projectId }: { projectId: string | null }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [sortField, setSortField] = useState<keyof AgencyMetrics | null>('spend');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
    const [accountTokens, setAccountTokens] = useState<Record<string, string>>({});
    const [tokenLoading, setTokenLoading] = useState<Record<string, boolean>>({});

    const dateRange = useMemo(() => ({
        from: startOfMonth(currentMonth),
        to: endOfMonth(currentMonth)
    }), [currentMonth]);

    // Modal form state
    const [newAccountId, setNewAccountId] = useState('');
    const [newAccountToken, setNewAccountToken] = useState('');
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState<'personal' | 'agency'>('agency');

    const { metrics, isLoading, syncing, triggerSync, connectAccount } = useAgencyAnalytics(projectId, dateRange || {});

    const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: ru });

    // Formatting helpers
    const formatMoney = (val: number) => Math.round(val).toLocaleString('ru-RU') + ' ₸';
    const formatPercent = (val: number) => val.toFixed(1) + '%';

    const handleConnect = async () => {
        if (!newAccountId || !newAccountToken || !newAccountName) {
            toast.error('Заполните все поля (ID, Token, Name)');
            return;
        }
        const cleanId = newAccountId.replace('act_', '');
        await connectAccount(cleanId, newAccountName, newAccountToken, newAccountType);
        setIsConnectModalOpen(false);
        setNewAccountId('');
        setNewAccountToken('');
        setNewAccountName('');
        setNewAccountType('agency');
    };

    const handleAccountClick = useCallback(async (accountId: string) => {
        if (expandedAccountId === accountId) {
            setExpandedAccountId(null);
            return;
        }
        setExpandedAccountId(accountId);
        if (!accountTokens[accountId]) {
            setTokenLoading(prev => ({ ...prev, [accountId]: true }));
            try {
                const { data } = await supabase
                    .from('clients_config')
                    .select('fb_token')
                    .eq('ad_account_id', accountId)
                    .maybeSingle();
                if (data?.fb_token) {
                    setAccountTokens(prev => ({ ...prev, [accountId]: data.fb_token }));
                } else {
                    toast.error('Токен Facebook не найден для этого кабинета');
                    setExpandedAccountId(null);
                }
            } catch {
                toast.error('Ошибка загрузки токена');
                setExpandedAccountId(null);
            } finally {
                setTokenLoading(prev => ({ ...prev, [accountId]: false }));
            }
        }
    }, [expandedAccountId, accountTokens]);

    const handleSort = (field: keyof AgencyMetrics) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedMetrics = useMemo(() => {
        if (!sortField) return metrics;
        return [...metrics].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;

            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }, [metrics, sortField, sortDirection]);

    const SortableTableHead = ({ field, label, align = 'right' }: { field: keyof AgencyMetrics, label: string, align?: 'left' | 'right' }) => {
        const isActive = sortField === field;
        return (
            <TableHead
                className={cn("font-semibold text-white/40 cursor-pointer select-none hover:bg-white/5 transition-colors whitespace-nowrap py-4", align === "right" && "text-right")}
                onClick={() => handleSort(field)}
            >
                <div className={cn("flex items-center gap-1", align === 'right' ? "justify-end" : "justify-start")}>
                    {label}
                    <div className="flex flex-col">
                        {isActive ? (
                            <ChevronDown className={cn("w-4 h-4 transition-transform", sortDirection === 'asc' && "rotate-180")} />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
                        )}
                    </div>
                </div>
            </TableHead>
        );
    };

    return (
        <div className="rounded-3xl border border-white/10 bg-[#020617]/60 backdrop-blur-3xl shadow-interstellar p-6 sm:p-8 space-y-8 mb-6 relative overflow-hidden group">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl group-hover:bg-blue-400/20 transition-all duration-700 pointer-events-none" />
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Сводка по рекламным кабинетам Meta</h2>
                        <p className="text-sm font-medium text-white/40 mt-1">
                            Энд-ту-энд аналитика от клика до выручки
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Month Selector */}
                    <div className="flex items-center bg-white/5 backdrop-blur-3xl border border-white/10 rounded-xl shadow-sm overflow-hidden h-11">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-full rounded-none hover:bg-white/5 border-r border-white/10"
                            onClick={prevMonth}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="px-4 flex items-center gap-2 min-w-[140px] justify-center">
                            <CalendarDays className="w-4 h-4 text-white/30" />
                            <span className="text-sm font-semibold capitalize text-white/90">
                                {monthLabel}
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-full rounded-none hover:bg-white/5 border-l border-white/10"
                            onClick={nextMonth}
                            disabled={currentMonth >= startOfMonth(new Date())}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="icon" onClick={triggerSync} disabled={syncing}>
                        <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
                    </Button>

                    <Button className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 rounded-xl transition-all border-0" onClick={() => setIsConnectModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Подключить кабинет
                    </Button>
                </div>
            </div>

            {/* METRICS TABLE */}
            <div className="rounded-2xl border border-white/5 bg-[#020617]/40 backdrop-blur-md shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-white/[0.03] border-b border-white/[0.02] hover:bg-white/[0.03]">
                            <SortableTableHead field="accountName" label="Название кабинета" align="left" />
                            <SortableTableHead field="spend" label="Расходы (Spend)" />
                            <SortableTableHead field="metaLeads" label="Лиды (Meta)" />
                            <SortableTableHead field="cpl" label="CPL" />
                            <SortableTableHead field="lqr" label="LQR" />
                            <SortableTableHead field="cpql" label="CPQL" />
                            <SortableTableHead field="visits" label="Визиты" />
                            <SortableTableHead field="cpv" label="CPV" />
                            <SortableTableHead field="cac" label="CAC" />
                            <SortableTableHead field="revenue" label="Выручка" />
                            <SortableTableHead field="romi" label="ROMI" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                                    Загрузка данных...
                                </TableCell>
                            </TableRow>
                        ) : metrics.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <div className="p-3 bg-white/5 rounded-full mb-3 border border-white/5">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span>Нет подключенных кабинетов.</span>
                                        <Button variant="link" onClick={() => setIsConnectModalOpen(true)}>
                                            Добавить кабинет
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedMetrics.map((m) => {
                                const isRomiNegative = m.romi < 100;
                                const isExpanded = expandedAccountId === m.accountId;
                                const isTokenLoading = tokenLoading[m.accountId];
                                return (
                                    <>
                                    <TableRow key={m.accountId} className="group hover:bg-white/[0.02] border-b border-white/[0.02] transition-all">
                                        <TableCell>
                                            <button
                                                onClick={() => handleAccountClick(m.accountId)}
                                                className="flex items-center gap-2 font-bold text-white/90 hover:text-white transition-colors text-left"
                                            >
                                                {isTokenLoading ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />
                                                ) : (
                                                    <ChevronDown className={cn("w-3.5 h-3.5 text-white/30 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
                                                )}
                                                {m.accountName}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-white/90 tabular-nums">{formatMoney(m.spend)}</TableCell>
                                        <TableCell className="text-right text-white/90 font-medium">
                                            {m.metaLeads}
                                            {m.crmLeads > 0 && <span className="text-[10px] text-white/40 block font-black uppercase tracking-widest mt-1">CRM: {m.crmLeads}</span>}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-white/90 tabular-nums">{formatMoney(m.cpl)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn("px-2.5 py-1 rounded-full inline-block text-[10px] font-black uppercase tracking-widest", m.lqr > 30 ? "bg-primary/20 text-primary border border-primary/20" : "bg-white/5 text-white/40")}>
                                                {formatPercent(m.lqr)}
                                            </div>
                                            <div className="text-[10px] text-white/40 mt-1 font-black uppercase tracking-widest">{m.qualifiedLeads} квал.</div>
                                        </TableCell>
                                        <TableCell className="text-right text-white/40 font-medium tabular-nums">{formatMoney(m.cpql)}</TableCell>
                                        <TableCell className="text-right text-white/40 font-medium tabular-nums">{m.visits}</TableCell>
                                        <TableCell className="text-right text-white/40 font-medium tabular-nums">{formatMoney(m.cpv)}</TableCell>
                                        <TableCell className="text-right font-medium text-white/90 tabular-nums">{formatMoney(m.cac)}</TableCell>
                                        <TableCell className="text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{formatMoney(m.revenue)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn(
                                                "font-bold text-sm px-2.5 py-1 rounded-md inline-block",
                                                isRomiNegative
                                                    ? "bg-red-500/10 text-red-500"
                                                    : m.romi > 200 ? "bg-primary/20 text-primary border border-primary/20 ring-1 ring-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-primary/10 text-primary border border-primary/10"
                                            )}>
                                                {formatPercent(m.romi)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && accountTokens[m.accountId] && (
                                        <TableRow key={`${m.accountId}-campaigns`} className="border-b border-white/[0.02] bg-white/[0.01]">
                                            <TableCell colSpan={11} className="p-0">
                                                <AccountCampaigns accountId={m.accountId} fbToken={accountTokens[m.accountId]} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    </>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* CONNECT MODAL */}
            <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-[#020617]/90 backdrop-blur-3xl border-white/10 text-white shadow-interstellar">
                    <DialogHeader>
                        <DialogTitle>Подключить рекламный кабинет</DialogTitle>
                        <DialogDescription className="text-white/40">
                            Введите системный токен и ID кабинета (act_XXX). Выберите тип: личный кабинет виден во всей аналитике, агентский — только в разделе "Агентские кабинеты".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Account type selector */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Тип кабинета</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewAccountType('personal')}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                                        newAccountType === 'personal'
                                            ? "border-blue-500/60 bg-blue-500/10 text-white"
                                            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                    )}
                                >
                                    <span className="text-sm font-bold">Личный</span>
                                    <span className="text-[11px] text-white/40">Виден во всей аналитике</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewAccountType('agency')}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                                        newAccountType === 'agency'
                                            ? "border-purple-500/60 bg-purple-500/10 text-white"
                                            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                    )}
                                >
                                    <span className="text-sm font-bold">Агентский</span>
                                    <span className="text-[11px] text-white/40">Только в агент. кабинетах</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Название кабинета
                            </label>
                            <Input
                                id="name"
                                placeholder="Например: Стоматология Астана"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="accountId" className="text-sm font-medium">
                                Ad Account ID
                            </label>
                            <Input
                                id="accountId"
                                placeholder="act_1234567890"
                                value={newAccountId}
                                onChange={(e) => setNewAccountId(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="token" className="text-sm font-black uppercase tracking-widest text-white/40">
                                System Access Token
                            </label>
                            <Input
                                id="token"
                                type="password"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl"
                                placeholder="EAAGm0P..."
                                value={newAccountToken}
                                onChange={(e) => setNewAccountToken(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConnectModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleConnect}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Подключить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};
