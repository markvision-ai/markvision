import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Plus,
    Trash2,
    TrendingUp,
    Target,
    Users,
    ArrowRight,
    DollarSign,
    PieChart,
    Settings2,
    ChevronDown,
    LayoutDashboard,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Product {
    id: string;
    name: string;
    price: number;
    share: number;
}

interface Expense {
    id: string;
    name: string;
    value: number; // For fixed it's amount, for variable it's percentage
}

interface CalculatorState {
    mode: 'revenue' | 'profit';
    targetValue: number;
    cpl: number;
    cr1: number; // View to Lead %
    cr2: number; // Lead to Sale %
    products: Product[];
    fixedExpenses: Expense[];
    variableExpenses: Expense[];
}

const DEFAULT_STATE: CalculatorState = {
    mode: 'revenue',
    targetValue: 1000000,
    cpl: 1500,
    cr1: 5,
    cr2: 10,
    products: [
        { id: '1', name: 'Продукт 1', price: 100000, share: 100 }
    ],
    fixedExpenses: [
        { id: '1', name: 'Аренда', value: 50000 },
        { id: '2', name: 'ФОТ', value: 150000 }
    ],
    variableExpenses: [
        { id: '1', name: 'Налоги', value: 6 },
        { id: '2', name: 'Эквайринг', value: 2.5 }
    ]
};

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);

const formatNumber = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(Math.round(val));

const LabelCaps = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <Label className={cn("text-[9px] font-black uppercase tracking-[0.25em] text-white/30", className)}>
        {children}
    </Label>
);

export const DecompositionCalculator: React.FC<{ projectId: string }> = ({ projectId }) => {
    const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);

    // Helper to update deeply nested state
    const updateState = (updates: Partial<CalculatorState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    // Logic
    const results = useMemo(() => {
        const avgCheck = state.products.reduce((acc, p) => acc + (p.price * (p.share / 100)), 0);
        const totalVarPercent = state.variableExpenses.reduce((acc, e) => acc + (e.value / 100), 0);
        const totalFixed = state.fixedExpenses.reduce((acc, e) => acc + e.value, 0);

        let revenue = 0;
        let targetProfit = 0;

        if (state.mode === 'revenue') {
            revenue = state.targetValue;
        } else {
            targetProfit = state.targetValue;
            // Formula: Revenue = (Target Profit + Fixed Costs) / (1 - (CPL / (Average Check * CR2)) - Total_Variable_Percentage)
            const denominator = (1 - (state.cpl / (avgCheck * (state.cr2 / 100))) - totalVarPercent);
            revenue = denominator > 0 ? (targetProfit + totalFixed) / denominator : 0;
        }

        const sales = avgCheck > 0 ? Math.round(revenue / avgCheck) : 0;
        const leads = (state.cr2 > 0) ? Math.round(sales / (state.cr2 / 100)) : 0;
        const views = (state.cr1 > 0) ? Math.round(leads / (state.cr1 / 100)) : 0;

        const marketingCost = leads * state.cpl;
        const variableCost = revenue * totalVarPercent;
        const totalExpenses = marketingCost + totalFixed + variableCost;
        const netProfit = revenue - totalExpenses;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        const romi = marketingCost > 0 ? ((revenue - marketingCost) / marketingCost) * 100 : 0;
        const roi = totalExpenses > 0 ? ((revenue - totalExpenses) / totalExpenses) * 100 : 0;

        const cacMarketing = sales > 0 ? marketingCost / sales : 0;
        const cacTotal = sales > 0 ? (marketingCost + totalFixed) / sales : 0;

        return {
            revenue,
            sales,
            leads,
            views,
            marketingCost,
            variableCost,
            totalFixed,
            totalExpenses,
            netProfit,
            margin,
            romi,
            roi,
            cacMarketing,
            cacTotal,
            avgCheck
        };
    }, [state]);

    // Handlers
    const addProduct = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        updateState({ products: [...state.products, { id: newId, name: `Продукт ${state.products.length + 1}`, price: 10000, share: 0 }] });
    };

    const removeProduct = (id: string) => {
        updateState({ products: state.products.filter(p => p.id !== id) });
    };

    const updateProduct = (id: string, field: keyof Product, value: any) => {
        updateState({
            products: state.products.map(p => p.id === id ? { ...p, [field]: value } : p)
        });
    };

    const addExpense = (type: 'fixed' | 'variable') => {
        const newId = Math.random().toString(36).substr(2, 9);
        const item = { id: newId, name: 'Новый расход', value: 0 };
        if (type === 'fixed') {
            updateState({ fixedExpenses: [...state.fixedExpenses, item] });
        } else {
            updateState({ variableExpenses: [...state.variableExpenses, item] });
        }
    };

    const removeExpense = (type: 'fixed' | 'variable', id: string) => {
        if (type === 'fixed') {
            updateState({ fixedExpenses: state.fixedExpenses.filter(e => e.id !== id) });
        } else {
            updateState({ variableExpenses: state.variableExpenses.filter(e => e.id !== id) });
        }
    };

    const updateExpense = (type: 'fixed' | 'variable', id: string, field: keyof Expense, value: any) => {
        if (type === 'fixed') {
            updateState({ fixedExpenses: state.fixedExpenses.map(e => e.id === id ? { ...e, [field]: value } : e) });
        } else {
            updateState({ variableExpenses: state.variableExpenses.map(e => e.id === id ? { ...e, [field]: value } : e) });
        }
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8 p-1 md:p-8 w-full animate-in fade-in duration-700 max-w-[1600px] mx-auto">

            {/* Sidebar Controls */}
            <div className="w-full xl:w-[420px] space-y-6 shrink-0">
                <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden shadow-interstellar border-t-white/20">
                    <CardContent className="p-8 md:p-10 space-y-10">

                        {/* Mode Selection */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/20 border border-primary/30 shadow-lg shadow-primary/10">
                                    <Settings2 className="w-4 h-4 text-primary" />
                                </div>
                                <LabelCaps>Режим расчета</LabelCaps>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-black/40 rounded-3xl border border-white/5">
                                <button
                                    onClick={() => updateState({ mode: 'revenue' })}
                                    className={cn(
                                        "py-3.5 px-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-700 relative overflow-hidden group/btn",
                                        state.mode === 'revenue'
                                            ? "text-white shadow-2xl shadow-primary/40 ring-1 ring-white/20"
                                            : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    {state.mode === 'revenue' && (
                                        <motion.div
                                            layoutId="mode-bg"
                                            className="absolute inset-0 bg-gradient-to-br from-primary to-[#B57170]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">От Выручки</span>
                                </button>
                                <button
                                    onClick={() => updateState({ mode: 'profit' })}
                                    className={cn(
                                        "py-3.5 px-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-700 relative overflow-hidden group/btn",
                                        state.mode === 'profit'
                                            ? "text-white shadow-2xl shadow-primary/40 ring-1 ring-white/20"
                                            : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    {state.mode === 'profit' && (
                                        <motion.div
                                            layoutId="mode-bg"
                                            className="absolute inset-0 bg-gradient-to-br from-primary to-[#B57170]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">От Прибыли</span>
                                </button>
                            </div>
                        </div>

                        {/* Target Input */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 text-secondary">
                                <div className="p-2.5 rounded-2xl bg-secondary/20 border border-secondary/30 shadow-lg shadow-secondary/10">
                                    <Target className="w-4 h-4" />
                                </div>
                                <LabelCaps className="text-secondary/80">
                                    {state.mode === 'revenue' ? 'Целевая выручка' : 'Целевая чистая прибыль'}
                                </LabelCaps>
                            </div>
                            <div className="relative group">
                                <Input
                                    type="number"
                                    value={state.targetValue}
                                    onChange={(e) => updateState({ targetValue: Number(e.target.value) })}
                                    className="h-20 bg-black/40 border-white/10 rounded-[1.5rem] text-3xl font-black tabular-nums tracking-tighter focus:border-secondary/50 group-hover:border-white/20 transition-all text-white px-8 pr-12"
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white/10 font-black tracking-widest text-xs group-hover:text-secondary/40 transition-colors">₸</div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        {/* Marketing Metrics */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/40">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <LabelCaps>Маркетинг и Воронка</LabelCaps>
                            </div>

                            <div className="grid gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <LabelCaps className="text-white/20">CPL (₸ за лид)</LabelCaps>
                                        <span className="text-[10px] font-black text-white/50 tabular-nums">{formatCurrency(state.cpl)}</span>
                                    </div>
                                    <Input
                                        type="number"
                                        value={state.cpl}
                                        onChange={(e) => updateState({ cpl: Number(e.target.value) })}
                                        className="h-12 bg-black/40 border-white/10 rounded-2xl font-black tabular-nums transition-all focus:border-primary/50 text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <LabelCaps className="text-white/20 px-1">CR1 (Визит → Лид) %</LabelCaps>
                                        <Input
                                            type="number"
                                            value={state.cr1}
                                            onChange={(e) => updateState({ cr1: Number(e.target.value) })}
                                            className="h-12 bg-black/40 border-white/10 rounded-2xl font-black tabular-nums transition-all focus:border-white/30 text-white"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <LabelCaps className="text-white/20 px-1">CR2 (Лид → Продажа) %</LabelCaps>
                                        <Input
                                            type="number"
                                            value={state.cr2}
                                            onChange={(e) => updateState({ cr2: Number(e.target.value) })}
                                            className="h-12 bg-black/40 border-white/10 rounded-2xl font-black tabular-nums transition-all focus:border-white/30 text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        {/* Products Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40">
                                        <PieChart className="w-4 h-4" />
                                    </div>
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Товары / Услуги</Label>
                                </div>
                                <Button
                                    onClick={addProduct}
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg hover:bg-white/5 text-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence initial={false}>
                                    {state.products.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 group"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <Input
                                                    value={product.name}
                                                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                                    className="h-8 bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-white/80 focus-visible:ring-0"
                                                />
                                                <button
                                                    onClick={() => removeProduct(product.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 text-primary transition-all rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={product.price}
                                                        onChange={(e) => updateProduct(product.id, 'price', Number(e.target.value))}
                                                        className="h-10 bg-black/40 border-white/10 rounded-xl text-[11px] font-black tabular-nums pl-8 text-white"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-white/20">₸</span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={product.share}
                                                        onChange={(e) => updateProduct(product.id, 'share', Number(e.target.value))}
                                                        className="h-10 bg-black/40 border-white/10 rounded-xl text-[11px] font-black tabular-nums pr-8 text-right text-white"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-white/20">%</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {state.products.length === 0 && (
                                    <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Добавьте товары</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        {/* Expenses Sections */}
                        <div className="space-y-8">
                            {/* Fixed */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40">
                                            <LayoutDashboard className="w-4 h-4" />
                                        </div>
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Постоянные (Fix)</Label>
                                    </div>
                                    <Button
                                        onClick={() => addExpense('fixed')}
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 rounded-lg hover:bg-white/5 text-primary"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {state.fixedExpenses.map((exp) => (
                                        <div key={exp.id} className="flex gap-3 group items-center">
                                            <div className="flex-1 relative">
                                                <Input
                                                    value={exp.name}
                                                    onChange={(e) => updateExpense('fixed', exp.id, 'name', e.target.value)}
                                                    className="h-12 bg-black/40 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 focus:border-white/30"
                                                />
                                            </div>
                                            <div className="relative w-40 shrink-0">
                                                <Input
                                                    type="number"
                                                    value={exp.value}
                                                    onChange={(e) => updateExpense('fixed', exp.id, 'value', Number(e.target.value))}
                                                    className="h-12 bg-black/40 border-white/10 rounded-2xl text-xs font-black tabular-nums text-right text-white pr-10"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-white/20">₸</span>
                                            </div>
                                            <button
                                                onClick={() => removeExpense('fixed', exp.id)}
                                                className="p-3 hover:bg-primary/10 text-primary transition-all rounded-2xl border border-transparent hover:border-primary/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Variable */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-white/40">
                                        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                                            <PieChart className="w-4 h-4" />
                                        </div>
                                        <LabelCaps>Переменные (Var)</LabelCaps>
                                    </div>
                                    <Button
                                        onClick={() => addExpense('variable')}
                                        variant="ghost"
                                        size="icon"
                                        className="w-10 h-10 rounded-xl hover:bg-white/5 text-primary border border-white/5"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {state.variableExpenses.map((exp) => (
                                        <div key={exp.id} className="flex gap-3 group items-center">
                                            <div className="flex-1 relative">
                                                <Input
                                                    value={exp.name}
                                                    onChange={(e) => updateExpense('variable', exp.id, 'name', e.target.value)}
                                                    className="h-12 bg-black/40 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 focus:border-white/30"
                                                />
                                            </div>
                                            <div className="relative w-40 shrink-0">
                                                <Input
                                                    type="number"
                                                    value={exp.value}
                                                    onChange={(e) => updateExpense('variable', exp.id, 'value', Number(e.target.value))}
                                                    className="h-12 bg-black/40 border-white/10 rounded-2xl text-xs font-black tabular-nums text-right text-white pr-10"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-white/20">%</span>
                                            </div>
                                            <button
                                                onClick={() => removeExpense('variable', exp.id)}
                                                className="p-3 hover:bg-primary/10 text-primary transition-all rounded-2xl border border-transparent hover:border-primary/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* Main Results Dashboard */}
            <div className="flex-1 space-y-6">

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.08] transition-all duration-700 border-t-white/15 shadow-interstellar-glow-strong">
                        <CardContent className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="p-4 rounded-[1.5rem] bg-secondary/20 border border-secondary/30 shadow-2xl shadow-secondary/10 group-hover:scale-110 transition-transform duration-500">
                                    <DollarSign className="w-8 h-8 text-secondary" />
                                </div>
                                <div className="text-right">
                                    <LabelCaps className="text-white/20">Чистая прибыль</LabelCaps>
                                    <p className="text-4xl font-black tabular-nums tracking-tight text-white mt-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                        {formatCurrency(results.netProfit)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <LabelCaps>Рентабельность</LabelCaps>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-secondary font-black tabular-nums text-2xl tracking-tighter">{results.margin.toFixed(1)}</span>
                                    <span className="text-[10px] font-black text-secondary/40">%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.08] transition-all duration-700 border-t-white/15 shadow-interstellar-glow">
                        <CardContent className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="p-4 rounded-[1.5rem] bg-primary/20 border border-primary/30 shadow-2xl shadow-primary/10 group-hover:scale-110 transition-transform duration-500">
                                    <Target className="w-8 h-8 text-primary" />
                                </div>
                                <div className="text-right">
                                    <LabelCaps className="text-white/20">Необходимая выручка</LabelCaps>
                                    <p className="text-4xl font-black tabular-nums tracking-tight text-white mt-2">
                                        {formatCurrency(results.revenue)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <LabelCaps>Продаж (шт)</LabelCaps>
                                <span className="text-primary font-black tabular-nums text-2xl tracking-tighter">{formatNumber(results.sales)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.08] transition-all duration-700 border-t-white/15">
                        <CardContent className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="p-4 rounded-[1.5rem] bg-white/10 border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-right">
                                    <LabelCaps className="text-white/20">Окупаемость (ROI)</LabelCaps>
                                    <p className="text-4xl font-black tabular-nums tracking-tight text-white mt-2">
                                        {Math.round(results.roi)}%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <LabelCaps>ROMI (Маркетинг)</LabelCaps>
                                <span className="text-white/80 font-black tabular-nums text-2xl tracking-tighter">{Math.round(results.romi)}%</span>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Funnel Visualization */}
                <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden border-t-white/15">
                    <CardContent className="p-10 md:p-14">
                        <div className="flex items-center gap-5 mb-14">
                            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-xl">
                                <Users className="w-6 h-6 text-white/40" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-white">Воронка продаж</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-2">От охватов до чистой прибыли</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 justify-between relative px-6">

                            <div className="flex flex-col items-center gap-5 group">
                                <div className="w-36 h-36 rounded-[3rem] glass-morphism border-white/10 flex flex-col items-center justify-center group-hover:bg-white/10 transition-all duration-700 group-hover:scale-105 shadow-2xl">
                                    <span className="text-3xl font-black tabular-nums text-white tracking-tighter">{formatNumber(results.views)}</span>
                                    <LabelCaps className="mt-1 opacity-50">Просмотры</LabelCaps>
                                </div>
                            </div>

                            <div className="flex flex-col items-center z-10">
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="hidden md:block"
                                >
                                    <ArrowRight className="w-8 h-8 text-primary/40" />
                                </motion.div>
                                <ChevronDown className="w-8 h-8 text-primary/40 md:hidden" />
                                <span className="text-xs font-black text-primary mt-1 tabular-nums">{state.cr1}%</span>
                            </div>

                            <div className="flex flex-col items-center gap-5 group">
                                <div className="w-36 h-36 rounded-[3rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex flex-col items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-2xl shadow-primary/20 ring-1 ring-primary/20">
                                    <span className="text-3xl font-black tabular-nums text-white tracking-tighter">{formatNumber(results.leads)}</span>
                                    <LabelCaps className="mt-1 opacity-50">Лиды</LabelCaps>
                                </div>
                                <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 shadow-lg">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">CPL: {formatCurrency(state.cpl)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center z-10">
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                    className="hidden md:block"
                                >
                                    <ArrowRight className="w-8 h-8 text-secondary/40" />
                                </motion.div>
                                <ChevronDown className="w-8 h-8 text-secondary/40 md:hidden" />
                                <span className="text-xs font-black text-secondary mt-1 tabular-nums">{state.cr2}%</span>
                            </div>

                            <div className="flex flex-col items-center gap-5 group">
                                <div className="w-36 h-36 rounded-[3rem] bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 flex flex-col items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-2xl shadow-secondary/20 ring-1 ring-secondary/20">
                                    <span className="text-3xl font-black tabular-nums text-white tracking-tighter">{formatNumber(results.sales)}</span>
                                    <LabelCaps className="mt-1 opacity-50">Продажи</LabelCaps>
                                </div>
                                <div className="px-4 py-1.5 bg-secondary/10 rounded-full border border-secondary/20 shadow-lg">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Чек: {formatCurrency(results.avgCheck)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center z-10">
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                                    className="hidden md:block"
                                >
                                    <ArrowRight className="w-8 h-8 text-white/20" />
                                </motion.div>
                                <ChevronDown className="w-8 h-8 text-white/20 md:hidden" />
                                <span className="text-[9px] font-black text-white/20 mt-1 uppercase tracking-widest">Итог</span>
                            </div>

                            <div className="flex flex-col items-center gap-5 group">
                                <div className="w-40 h-40 rounded-[3.5rem] bg-gradient-to-br from-white/15 to-white/5 border border-white/20 flex flex-col items-center justify-center shadow-interstellar transition-all duration-700 hover:scale-105 group-hover:border-white/40">
                                    <LabelCaps className="mb-2 opacity-40">Выручка</LabelCaps>
                                    <span className="text-xl font-black tabular-nums text-white tracking-tighter">{formatCurrency(results.revenue)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Unit Economics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-[2.5rem]">
                        <CardContent className="p-8 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-4">Юнит-экономика CAC</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">CAC (Маркетинг)</span>
                                    <span className="text-lg font-black tabular-nums text-white">{formatCurrency(results.cacMarketing)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">CAC (Полный)</span>
                                    <span className="text-lg font-black tabular-nums text-white/80">{formatCurrency(results.cacTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center group pt-4 border-t border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Средний чек</span>
                                    <span className="text-xl font-black tabular-nums text-secondary">{formatCurrency(results.avgCheck)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-[2.5rem]">
                        <CardContent className="p-8 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-4">Структура расходов</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">Маркетинг</span>
                                    <span className="text-lg font-black tabular-nums text-primary">{formatCurrency(results.marketingCost)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">Постоянные (Fix)</span>
                                    <span className="text-lg font-black tabular-nums text-white/60">{formatCurrency(results.totalFixed)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">Переменные (Var)</span>
                                    <span className="text-lg font-black tabular-nums text-white/60">{formatCurrency(results.variableCost)}</span>
                                </div>
                                <div className="flex justify-between items-center group pt-4 border-t border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">Итого расходы</span>
                                    <span className="text-xl font-black tabular-nums text-white/40">{formatCurrency(results.totalExpenses)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </div>
    );
};
