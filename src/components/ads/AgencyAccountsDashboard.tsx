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
                className={cn("font-semibold cursor-pointer select-none hover:bg-muted/50 transition-colors whitespace-nowrap", align === 'right' && "text-right")}
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
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm mb-6">
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Сводка по рекламным кабинетам Meta</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Энд-ту-энд аналитика от клика до выручки
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Month Selector */}
                    <div className="flex items-center bg-card border border-border rounded-lg shadow-sm overflow-hidden h-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-full rounded-none hover:bg-accent border-r border-border"
                            onClick={prevMonth}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="px-4 flex items-center gap-2 min-w-[140px] justify-center">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold capitalize">
                                {monthLabel}
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-full rounded-none hover:bg-accent border-l border-border"
                            onClick={nextMonth}
                            disabled={currentMonth >= startOfMonth(new Date())}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="icon" onClick={triggerSync} disabled={syncing}>
                        <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
                    </Button>

                    <Button onClick={() => setIsConnectModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Подключить кабинет
                    </Button>
                </div>
            </div>

            {/* METRICS TABLE */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
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
                                        <div className="p-3 bg-muted rounded-full mb-3">
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
                                    <TableRow key={m.accountId} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="font-medium text-foreground">{m.accountName}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatMoney(m.spend)}</TableCell>
                                        <TableCell className="text-right">
                                            {m.metaLeads}
                                            {m.crmLeads > 0 && <span className="text-xs text-muted-foreground block">CRM: {m.crmLeads}</span>}
                                        </TableCell>
                                        <TableCell className="text-right">{formatMoney(m.cpl)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn("px-2 py-0.5 rounded-full inline-block text-xs font-semibold", m.lqr > 30 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>
                                                {formatPercent(m.lqr)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">{m.qualifiedLeads} квал.</div>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatMoney(m.cpql)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{m.visits}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatMoney(m.cpv)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatMoney(m.cac)}</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-500">{formatMoney(m.revenue)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn(
                                                "font-bold text-sm px-2.5 py-1 rounded-md inline-block",
                                                isRomiNegative
                                                    ? "bg-red-500/10 text-red-500"
                                                    : "bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] border border-emerald-500/20"
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Подключение Agency Кабинета</DialogTitle>
                        <DialogDescription>
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
                            <label htmlFor="token" className="text-sm font-medium">
                                System Access Token
                            </label>
                            <Input
                                id="token"
                                type="password"
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
        </div>
    );
};
