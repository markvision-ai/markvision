import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAgencyAnalytics } from '@/hooks/useAgencyAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { format, subDays, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Copy, Plus, RefreshCw, CalendarDays, ChevronDown, CheckCircle2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { AgencyMetrics } from '@/hooks/useAgencyAnalytics';

export const AgencyAccountsDashboard = ({ projectId }: { projectId: string | null }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [sortField, setSortField] = useState<keyof AgencyMetrics | null>('spend');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const dateRange = useMemo(() => ({
        from: startOfMonth(currentMonth),
        to: endOfMonth(currentMonth)
    }), [currentMonth]);

    // Modal form state
    const [newAccountId, setNewAccountId] = useState('');
    const [newAccountToken, setNewAccountToken] = useState('');
    const [newAccountName, setNewAccountName] = useState('');

    const { metrics, isLoading, syncing, triggerSync, connectAccount } = useAgencyAnalytics(projectId, dateRange || {});

    const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: ru });

    // Formatting helpers
    const formatMoney = (val: number) => Math.round(val).toLocaleString('ru-RU') + ' ₸';
    const formatNum = (val: number) => Math.round(val).toLocaleString('ru-RU');
    const formatPercent = (val: number) => val.toFixed(1) + '%';

    const handleConnect = async () => {
        if (!newAccountId || !newAccountToken || !newAccountName) {
            toast.error('Заполните все поля (ID, Token, Name)');
            return;
        }
        const cleanId = newAccountId.replace('act_', '');
        await connectAccount(cleanId, newAccountName, newAccountToken);
        setIsConnectModalOpen(false);
        setNewAccountId('');
        setNewAccountToken('');
        setNewAccountName('');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Скопировано в буфер обмена');
    };

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
                                return (
                                    <TableRow key={m.accountId} className="group hover:bg-white/[0.02] border-b border-white/[0.02] transition-all">
                                        <TableCell>
                                            <div className="font-bold text-white/90">{m.accountName}</div>
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
                        <DialogTitle>Подключение Agency Кабинета</DialogTitle>
                        <DialogDescription className="text-white/40">
                            Введите системный токен и ID кабинета (act_XXX), чтобы собирать статистику напрямую из Meta Graph API.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
