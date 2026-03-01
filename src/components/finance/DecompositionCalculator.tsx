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
    LayoutDashboard
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
        <div className="flex flex-col xl:flex-row gap-6 p-1 md:p-6 w-full animate-in fade-in duration-700">

            {/* Sidebar Controls */}
            <div className="w-full xl:w-[380px] space-y-4 shrink-0">
                <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden shadow-interstellar">
                    <CardContent className="p-6 md:p-8 space-y-8">

                        {/* Mode Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                    <Settings2 className="w-4 h-4 text-primary" />
                                </div>
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Режим расчета</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => updateState({ mode: 'revenue' })}
                                    className={cn(
                                        "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                        state.mode === 'revenue' ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    От Выручки
                                </button>
                                <button
                                    onClick={() => updateState({ mode: 'profit' })}
                                    className={cn(
                                        "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                        state.mode === 'profit' ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    От Прибыли
                                </button>
                            </div>
                        </div>

                        {/* Target Input */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-secondary">
                                <div className="p-2 rounded-xl bg-secondary/10 border border-secondary/20">
                                    <Target className="w-4 h-4" />
                                </div>
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/60">
                                    {state.mode === 'revenue' ? 'Целевая выручка' : 'Целевая чистая прибыль'}
                                </Label>
                            </div>
                            <div className="relative group">
                                <Input
                                    type="number"
                                    value={state.targetValue}
                                    onChange={(e) => updateState({ targetValue: Number(e.target.value) })}
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-xl font-black tabular-nums focus:border-secondary/50 group-hover:border-white/20 transition-all text-white px-6"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 font-black tracking-widest text-[10px]">₸</div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        {/* Marketing Metrics */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Маркетинг и Воронка</Label>
                            </div>

                            <div className="grid gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">CPL (₸ за лид)</Label>
                                        <span className="text-[10px] font-black text-white/60 tabular-nums">{formatCurrency(state.cpl)}</span>
                                    </div>
                                    <Input
                                        type="number"
                                        value={state.cpl}
                                        onChange={(e) => updateState({ cpl: Number(e.target.value) })}
                                        className="h-11 bg-white/5 border-white/10 rounded-xl font-black tabular-nums transition-all focus:border-primary/50 text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">CR1 (Визит → Лид) %</Label>
                                        <Input
                                            type="number"
                                            value={state.cr1}
                                            onChange={(e) => updateState({ cr1: Number(e.target.value) })}
                                            className="h-11 bg-white/5 border-white/10 rounded-xl font-black tabular-nums transition-all focus:border-white/30 text-white"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">CR2 (Лид → Продажа) %</Label>
                                        <Input
                                            type="number"
                                            value={state.cr2}
                                            onChange={(e) => updateState({ cr2: Number(e.target.value) })}
                                            className="h-11 bg-white/5 border-white/10 rounded-xl font-black tabular-nums transition-all focus:border-white/30 text-white"
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
                                                        className="h-9 bg-white/5 border-white/10 rounded-xl text-[11px] font-black tabular-nums pl-6 text-white"
                                                    />
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-white/20">₸</span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={product.share}
                                                        onChange={(e) => updateProduct(product.id, 'share', Number(e.target.value))}
                                                        className="h-9 bg-white/5 border-white/10 rounded-xl text-[11px] font-black tabular-nums pr-6 text-right text-white"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-white/20">%</span>
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
                                <div className="space-y-2">
                                    {state.fixedExpenses.map((exp) => (
                                        <div key={exp.id} className="flex gap-2 group">
                                            <Input
                                                value={exp.name}
                                                onChange={(e) => updateExpense('fixed', exp.id, 'name', e.target.value)}
                                                className="h-10 bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60"
                                            />
                                            <div className="relative w-32 shrink-0">
                                                <Input
                                                    type="number"
                                                    value={exp.value}
                                                    onChange={(e) => updateExpense('fixed', exp.id, 'value', Number(e.target.value))}
                                                    className="h-10 bg-white/5 border-white/10 rounded-xl text-[11px] font-black tabular-nums text-right text-white pr-6"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white/20">₸</span>
                                            </div>
                                            <button
                                                onClick={() => removeExpense('fixed', exp.id)}
                                                className="p-2.5 hover:bg-white/10 text-primary transition-all rounded-xl"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Variable */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-white/40">
                                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                                            <PieChart className="w-4 h-4" />
                                        </div>
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em]">Переменные (Var)</Label>
                                    </div>
                                    <Button
                                        onClick={() => addExpense('variable')}
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 rounded-lg hover:bg-white/5 text-primary"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {state.variableExpenses.map((exp) => (
                                        <div key={exp.id} className="flex gap-2 group">
                                            <Input
                                                value={exp.name}
                                                onChange={(e) => updateExpense('variable', exp.id, 'name', e.target.value)}
                                                className="h-10 bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60"
                                            />
                                            <div className="relative w-32 shrink-0">
                                                <Input
                                                    type="number"
                                                    value={exp.value}
                                                    onChange={(e) => updateExpense('variable', exp.id, 'value', Number(e.target.value))}
                                                    className="h-10 bg-white/5 border-white/10 rounded-xl text-[11px] font-black tabular-nums text-right text-white pr-6"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white/20">%</span>
                                            </div>
                                            <button
                                                onClick={() => removeExpense('variable', exp.id)}
                                                className="p-2.5 hover:bg-white/10 text-primary transition-all rounded-xl"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
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

                    <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.07] transition-all duration-500">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 shadow-lg shadow-secondary/5 group-hover:scale-110 transition-transform">
                                    <DollarSign className="w-6 h-6 text-secondary" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Чистая прибыль</p>
                                    <p className="text-3xl font-black tabular-nums text-white mt-1">{formatCurrency(results.netProfit)}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Рентабельность</span>
                                <span className="text-secondary font-black tabular-nums text-lg">{results.margin.toFixed(1)}%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.07] transition-all duration-500">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5 group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Необходимая выручка</p>
                                    <p className="text-3xl font-black tabular-nums text-white mt-1">{formatCurrency(results.revenue)}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Продаж (шт)</span>
                                <span className="text-primary font-black tabular-nums text-lg">{formatNumber(results.sales)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.07] transition-all duration-500">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-white/10 border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Окупаемость (ROI)</p>
                                    <p className="text-3xl font-black tabular-nums text-white mt-1">{Math.round(results.roi)}%</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">ROMI (Маркетинг)</span>
                                <span className="text-white/80 font-black tabular-nums text-lg">{Math.round(results.romi)}%</span>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Funnel Visualization */}
                <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                <Users className="w-6 h-6 text-white/60" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white">Воронка продаж</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">От охватов до реальной прибыли</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative px-4">

                            <div className="flex flex-col items-center gap-4 group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center group-hover:bg-primary/5 transition-colors duration-500">
                                    <span className="text-2xl font-black tabular-nums text-white">{formatNumber(results.views)}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Просмотры</span>
                                </div>
                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Органика + Платное</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <ArrowRight className="w-6 h-6 text-white/10 hidden md:block" />
                                <ChevronDown className="w-6 h-6 text-white/10 md:hidden" />
                                <span className="text-[10px] font-black text-primary mt-2">{state.cr1}%</span>
                            </div>

                            <div className="flex flex-col items-center gap-4 group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-500">
                                    <span className="text-2xl font-black tabular-nums text-white">{formatNumber(results.leads)}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Лиды (Спрос)</span>
                                </div>
                                <div className="px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-primary">CPL: {formatCurrency(state.cpl)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <ArrowRight className="w-6 h-6 text-white/10 hidden md:block" />
                                <ChevronDown className="w-6 h-6 text-white/10 md:hidden" />
                                <span className="text-[10px] font-black text-secondary mt-2">{state.cr2}%</span>
                            </div>

                            <div className="flex flex-col items-center gap-4 group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-secondary/10 border border-secondary/20 flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-500">
                                    <span className="text-2xl font-black tabular-nums text-white">{formatNumber(results.sales)}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Продажи</span>
                                </div>
                                <div className="px-3 py-1 bg-secondary/5 rounded-full border border-secondary/10">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-secondary">Чек: {formatCurrency(results.avgCheck)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <ArrowRight className="w-6 h-6 text-white/10 hidden md:block" />
                                <ChevronDown className="w-6 h-6 text-white/10 md:hidden" />
                                <span className="text-[10px] font-black text-white/40 mt-2">Деньги</span>
                            </div>

                            <div className="flex flex-col items-center gap-4 group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-2xl">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Выручка</span>
                                    <span className="text-xl font-black tabular-nums text-white">{formatCurrency(results.revenue)}</span>
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
