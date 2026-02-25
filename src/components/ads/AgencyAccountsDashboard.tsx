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
import { Copy, Plus, RefreshCw, CalendarDays, ChevronDown, CheckCircle2, Activity } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange, DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const AgencyAccountsDashboard = ({ projectId }: { projectId: string | null }) => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    const [activePreset, setActivePreset] = useState<string>('this_month');
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

    // Modal form state
    const [newAccountId, setNewAccountId] = useState('');
    const [newAccountToken, setNewAccountToken] = useState('');
    const [newAccountName, setNewAccountName] = useState('');

    const { metrics, isLoading, syncing, triggerSync, connectAccount } = useAgencyAnalytics(projectId, dateRange || {});

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
                setDatePickerOpen(false);
            }
        };
        if (datePickerOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [datePickerOpen]);

    // Preset definitions
    const presets = useMemo(() => {
        const today = new Date();
        const yesterday = subDays(today, 1);
        return [
            { key: 'today', label: 'Сегодня', from: today, to: today },
            { key: 'yesterday', label: 'Вчера', from: yesterday, to: yesterday },
            { key: '7days', label: '7 дней', from: subDays(today, 6), to: today },
            { key: 'this_month', label: 'Этот месяц', from: startOfMonth(today), to: today },
            { key: 'last_month', label: 'Прошлый месяц', from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) },
            { key: 'maximum', label: 'Максимум', from: subDays(today, 365), to: today },
        ];
    }, []);

    const currentPresetLabel = useMemo(() => {
        const p = presets.find(p => p.key === activePreset);
        return p?.label || 'Период';
    }, [activePreset, presets]);

    const applyPreset = useCallback((key: string) => {
        const p = presets.find(pr => pr.key === key);
        if (p) {
            setDateRange({ from: p.from, to: p.to });
            setActivePreset(key);
            setDatePickerOpen(false);
        }
    }, [presets]);

    const applyCustomRange = useCallback((range: DateRange | undefined) => {
        if (range?.from) {
            setDateRange(range);
            setActivePreset('custom');
        }
    }, []);

    const dateButtonLabel = useMemo(() => {
        if (!dateRange?.from) return 'Выберите период';
        const fromStr = format(dateRange.from, 'd MMM yyyy г.', { locale: ru });
        if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
            return `${currentPresetLabel}: ${fromStr}`;
        }
        const toStr = format(dateRange.to, 'd MMM yyyy г.', { locale: ru });
        return `${fromStr} — ${toStr}`;
    }, [dateRange, currentPresetLabel]);

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
                    {/* Date Picker */}
                    <div className="relative" ref={datePickerRef}>
                        <button
                            onClick={() => setDatePickerOpen(prev => !prev)}
                            className={cn(
                                "inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium transition-all",
                                "bg-card border-border hover:border-primary/40 hover:bg-accent",
                                "text-foreground shadow-sm",
                                datePickerOpen && "border-primary ring-2 ring-primary/20"
                            )}
                        >
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <span>{dateButtonLabel}</span>
                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", datePickerOpen && "rotate-180")} />
                        </button>

                        {datePickerOpen && (
                            <div className="absolute right-0 top-full mt-2 z-[9999] bg-card border border-border rounded-xl shadow-xl flex overflow-hidden min-w-[520px]">
                                <div className="w-[180px] border-r border-border p-3 space-y-0.5">
                                    {presets.map(p => (
                                        <button
                                            key={p.key}
                                            onClick={() => applyPreset(p.key)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                                                activePreset === p.key
                                                    ? "bg-primary/10 text-primary font-semibold"
                                                    : "text-foreground hover:bg-accent"
                                            )}
                                        >
                                            {activePreset === p.key && (
                                                <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />
                                            )}
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-4">
                                    <DayPicker
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={applyCustomRange}
                                        numberOfMonths={2}
                                        locale={ru}
                                        showOutsideDays
                                        className="text-sm"
                                        classNames={{
                                            months: 'flex gap-4',
                                            month: 'space-y-3',
                                            caption: 'flex justify-center items-center h-8 relative',
                                            caption_label: 'text-sm font-semibold',
                                            nav: 'flex items-center gap-1',
                                            nav_button: 'h-7 w-7 bg-transparent border border-border hover:bg-accent rounded-md flex items-center justify-center transition-colors',
                                            head_row: 'flex',
                                            head_cell: 'text-muted-foreground w-9 font-medium text-[11px] uppercase',
                                            row: 'flex mt-0.5',
                                            cell: 'w-9 h-9 text-center text-sm relative',
                                            day: 'w-9 h-9 rounded-md hover:bg-accent transition-colors font-normal',
                                            day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
                                            day_today: 'border border-primary/30 font-semibold',
                                            day_outside: 'text-muted-foreground/40',
                                            day_range_middle: 'bg-primary/10 rounded-none',
                                            day_range_start: 'rounded-r-none',
                                            day_range_end: 'rounded-l-none',
                                        }}
                                    />
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                        <span className="text-xs text-muted-foreground">
                                            {dateRange?.from ? format(dateRange.from, 'd MMMM yyyy', { locale: ru }) : '—'}
                                            {dateRange?.to && dateRange.to.getTime() !== dateRange.from?.getTime()
                                                ? ` — ${format(dateRange.to, 'd MMMM yyyy', { locale: ru })}`
                                                : ''}
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => setDatePickerOpen(false)}
                                            className="h-8 px-4 text-xs"
                                        >
                                            Применить
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            <TableHead className="w-[200px] font-semibold">Название кабинета</TableHead>
                            <TableHead className="text-right font-semibold">Расходы (Spend)</TableHead>
                            <TableHead className="text-right font-semibold">Лиды</TableHead>
                            <TableHead className="text-right font-semibold">CPL</TableHead>
                            <TableHead className="text-right font-semibold">LQR</TableHead>
                            <TableHead className="text-right font-semibold">CPQL</TableHead>
                            <TableHead className="text-right font-semibold">Визиты</TableHead>
                            <TableHead className="text-right font-semibold">CPV</TableHead>
                            <TableHead className="text-right font-semibold">CAC</TableHead>
                            <TableHead className="text-right font-semibold">Выручка</TableHead>
                            <TableHead className="text-right font-semibold">ROMI</TableHead>
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
                            metrics.map((m) => {
                                const isRomiNegative = m.romi < 100;
                                return (
                                    <TableRow key={m.accountId} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="font-medium text-foreground">{m.accountName}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md flex-1 truncate max-w-[120px]">
                                                    act_{m.accountId}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(`act_${m.accountId}`)}
                                                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
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
