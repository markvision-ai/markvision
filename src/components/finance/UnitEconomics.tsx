import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, Clock, DollarSign, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const translations = {
  ru: {
    title: 'Юнит-экономика',
    margin: 'Маржинальность (%)',
    marginDesc: 'Процент прибыли в цене товара/услуги после вычета себестоимости.',
    freq: 'Частота (в мес)',
    freqDesc: 'Среднее количество покупок одним клиентом в месяц.',
    lifetime: 'Lifetime (мес)',
    lifetimeDesc: 'Среднее время жизни клиента (сколько месяцев он покупает).',
    ltv: 'LTV',
    ltvDesc: 'Прибыль с одного клиента',
    roi: 'ROI (LTV/CAC)',
    roiDesc: 'Возврат маркетинговых инвестиций',
    payback: 'Окупаемость',
    paybackDesc: 'Продаж для возврата CAC',
    paybackTime: 'Срок окупаемости',
    paybackTimeDesc: 'Месяцев для возврата CAC',
    ratio: 'LTV/CAC',
    ratioDesc: 'Отношение прибыли к стоимости привлечения (>3:1 отлично)',
    calcFor: 'Расчет для',
    avgCheck: 'Ср. чека'
  },
  en: {
    title: 'Unit Economics',
    margin: 'Margin (%)',
    marginDesc: 'Percentage of profit in price after deducting COGS.',
    freq: 'Frequency (per month)',
    freqDesc: 'Average number of purchases per customer per month.',
    lifetime: 'Lifetime (months)',
    lifetimeDesc: 'Average customer lifetime (how many months they buy).',
    ltv: 'LTV',
    ltvDesc: 'Lifetime Value per customer',
    roi: 'ROI',
    roiDesc: 'Return on Marketing Investment',
    payback: 'Payback',
    paybackDesc: 'Sales needed to recover CAC',
    paybackTime: 'Payback Time',
    paybackTimeDesc: 'Months to recover CAC',
    ratio: 'LTV/CAC',
    ratioDesc: 'Ratio of LTV to CAC (>3:1 is great)',
    calcFor: 'Calculation for',
    avgCheck: 'Avg Check'
  }
};

interface UnitEconomicsProps {
  avgCheck: number;
  cac: number;
  lang?: 'ru' | 'en';
}

export const UnitEconomics = ({ avgCheck, cac, lang = 'ru' }: UnitEconomicsProps) => {
  const t = translations[lang];
  const [margin, setMargin] = useState<number>(30); // %
  const [freq, setFreq] = useState<number>(1); // purchases per month/period
  const [lifetime, setLifetime] = useState<number>(6); // months

  const [ltv, setLtv] = useState<number>(0);
  const [payback, setPayback] = useState<number>(0);
  const [paybackTime, setPaybackTime] = useState<number>(0);
  const [roi, setRoi] = useState<number>(0);
  const [ratio, setRatio] = useState<number>(0);

  useEffect(() => {
    // Profit per user per period
    const profitPerSale = avgCheck * (margin / 100);
    
    // LTV = Profit * Frequency * Lifetime
    const calculatedLtv = profitPerSale * freq * lifetime;
    setLtv(calculatedLtv);

    // Payback Period (in sales count) = CAC / Profit per sale
    const paybackCount = profitPerSale > 0 ? cac / profitPerSale : 0;
    setPayback(paybackCount);

    // Payback Time (months) = Payback Sales / Frequency
    const pTime = freq > 0 ? paybackCount / freq : 0;
    setPaybackTime(pTime);

    // ROI = (LTV - CAC) / CAC * 100
    const calculatedRoi = cac > 0 ? ((calculatedLtv - cac) / cac) * 100 : 0;
    setRoi(calculatedRoi);

    // LTV/CAC Ratio
    const calcRatio = cac > 0 ? calculatedLtv / cac : 0;
    setRatio(calcRatio);

  }, [avgCheck, cac, margin, freq, lifetime]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  const ResultCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    colorClass, 
    bgClass,
    trend 
  }: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: any; 
    colorClass: string; 
    bgClass: string;
    trend?: 'up' | 'down';
  }) => (
    <div className={cn("p-4 rounded-xl border flex flex-col justify-between h-full transition-all duration-200 hover:shadow-md", bgClass, colorClass.replace('text-', 'border-').replace('600', '200'))}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-full bg-background/50", colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className={cn("text-sm font-semibold opacity-90", colorClass)}>{title}</span>
        </div>
        {trend && (
          trend === 'up' 
            ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> 
            : <ArrowDownRight className="h-4 w-4 text-red-600" />
        )}
      </div>
      <div>
        <div className={cn("text-2xl font-bold tracking-tight truncate", colorClass)} title={String(value)}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1 font-medium opacity-80">{subtitle}</div>
      </div>
    </div>
  );

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader className="py-4 px-6 bg-muted/30 flex flex-row items-center gap-3 border-b border-border/50">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-lg font-semibold tracking-tight">{t.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8 flex-1">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="margin-input" className="text-sm font-medium text-muted-foreground">{t.margin}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t.marginDesc}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input 
              id="margin-input"
              type="number" 
              value={margin} 
              onChange={(e) => setMargin(Number(e.target.value))}
              className="h-10 font-mono text-base bg-muted/20 focus:bg-background transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="freq-input" className="text-sm font-medium text-muted-foreground">{t.freq}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t.freqDesc}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input 
              id="freq-input"
              type="number" 
              value={freq} 
              onChange={(e) => setFreq(Number(e.target.value))}
              className="h-10 font-mono text-base bg-muted/20 focus:bg-background transition-colors"
            />
          </div>

          <div className="space-y-2">
             <div className="flex items-center gap-1.5">
              <Label htmlFor="lifetime-input" className="text-sm font-medium text-muted-foreground">{t.lifetime}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t.lifetimeDesc}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input 
              id="lifetime-input"
              type="number" 
              value={lifetime} 
              onChange={(e) => setLifetime(Number(e.target.value))}
              className="h-10 font-mono text-base bg-muted/20 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultCard 
            title={t.ltv} 
            value={formatCurrency(ltv)} 
            subtitle={t.ltvDesc} 
            icon={Calculator}
            colorClass="text-violet-600"
            bgClass="bg-violet-500/10"
            trend={undefined}
          />
          <ResultCard 
            title={t.roi} 
            value={`${roi.toFixed(0)}%`} 
            subtitle={t.roiDesc} 
            icon={TrendingUp}
            colorClass={roi > 0 ? "text-emerald-600" : "text-red-600"}
            bgClass={roi > 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
            trend={roi > 0 ? 'up' : 'down'}
          />
          <ResultCard 
            title={t.ratio} 
            value={`${ratio.toFixed(1)}:1`} 
            subtitle={t.ratioDesc} 
            icon={TrendingUp}
            colorClass={ratio >= 3 ? "text-emerald-600" : ratio >= 1 ? "text-yellow-600" : "text-red-600"}
            bgClass={ratio >= 3 ? "bg-emerald-500/10" : ratio >= 1 ? "bg-yellow-500/10" : "bg-red-500/10"}
            trend={ratio >= 1 ? 'up' : 'down'}
          />
          <ResultCard 
            title={t.payback} 
            value={payback.toFixed(1)} 
            subtitle={t.paybackDesc} 
            icon={Clock}
            colorClass="text-blue-600"
            bgClass="bg-blue-500/10"
            trend={undefined}
          />
          <ResultCard 
            title={t.paybackTime} 
            value={`${paybackTime.toFixed(1)} мес`} 
            subtitle={t.paybackTimeDesc} 
            icon={Clock}
            colorClass="text-orange-600"
            bgClass="bg-orange-500/10"
            trend={undefined}
          />
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            {t.calcFor} <span className="font-medium text-foreground">CAC = {formatCurrency(cac)}</span> {lang === 'ru' ? 'и' : 'and'} <span className="font-medium text-foreground">{t.avgCheck} = {formatCurrency(avgCheck)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
