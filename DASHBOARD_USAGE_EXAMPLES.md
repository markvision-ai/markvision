# 📚 Примеры использования обновленных компонентов дашборда

## 🎯 Быстрый старт

### 1. MetricCard с автоматическим трендом

```tsx
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DollarSign } from 'lucide-react';

// В вашем компоненте:
const [currentRevenue, setCurrentRevenue] = useState(150000);
const [previousRevenue, setPreviousRevenue] = useState(120000);

<MetricCard
  label="Выручка за месяц"
  value={currentRevenue}
  previousValue={previousRevenue}  // ← Автоматически покажет ↑ 25%
  icon={<DollarSign className="w-5 h-5" />}
  variant="success"
/>
```

**Результат:**
```
┌─────────────────────────┐
│ Выручка за месяц   ↑25% $│
│                         │
│ 150 000 ₸              │
└─────────────────────────┘
```

---

### 2. MetricCard со Sparkline графиком

```tsx
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendingUp } from 'lucide-react';

// Данные за последние 7 дней:
const weeklyAverageCheck = [70000, 72000, 71000, 74000, 73000, 75000, 76000];

<MetricCard
  label="Средний чек"
  value={75000}
  previousValue={72000}
  sparklineData={weeklyAverageCheck}  // ← Мини-график динамики
  icon={<TrendingUp className="w-5 h-5" />}
  variant="primary"
/>
```

**Результат:**
```
┌─────────────────────────┐
│ Средний чек    ↑4%  📈  │
│                         │
│ 75 000 ₸  ╱╲╱╲╱▔      │  ← Sparkline график
└─────────────────────────┘
```

---

### 3. PlanFactCard с умными эффектами

```tsx
import { PlanFactCard } from '@/components/dashboard/PlanFactCard';
import { Target } from 'lucide-react';

// Пример 1: Обычное выполнение (< 100%)
<PlanFactCard
  label="Лиды"
  value={75}
  plan={100}
  fact={75}
  icon={<Target className="w-5 h-5" />}
  format="number"
/>
// → Синий прогресс-бар (75%)

// Пример 2: Выполнение плана (100%+)
<PlanFactCard
  label="Диагностики"
  value={120}
  plan={100}
  fact={120}
  icon={<Target className="w-5 h-5" />}
  format="number"
/>
// → Зеленый прогресс-бар с glow эффектом ✨ (120%)

// Пример 3: Перевыполнение (200%+)
<PlanFactCard
  label="Показы"
  value={2500000}
  plan={1000000}
  fact={2500000}
  icon={<Target className="w-5 h-5" />}
  format="number"
/>
// → Градиент золото→индиго 🌟 (250%)
```

---

### 4. Компактный LTV виджет

```tsx
import { AverageLtvWidget } from '@/components/dashboard/AverageLtvWidget';

<AverageLtvWidget projectId={currentProjectId} />
```

**Что изменилось:**
- ✅ Высота в 2 раза меньше
- ✅ Glassmorphism стиль (`backdrop-blur-lg`)
- ✅ Иконка ₸ вместо $
- ✅ Убрана секция "Топ клиенты"

---

## 💡 Продвинутые примеры

### Пример: Дашборд с данными из Supabase

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PlanFactCard } from '@/components/dashboard/PlanFactCard';

export const MyDashboard = ({ projectId }: { projectId: string }) => {
  const [metrics, setMetrics] = useState({
    currentRevenue: 0,
    previousRevenue: 0,
    currentLeads: 0,
    planLeads: 100,
    weeklyRevenue: [] as number[],
  });

  useEffect(() => {
    const fetchData = async () => {
      // Текущий месяц
      const { data: currentMonth } = await supabase
        .from('daily_data')
        .select('revenue, leads')
        .eq('project_id', projectId)
        .gte('date', startOfMonth(new Date()))
        .lte('date', endOfMonth(new Date()));

      // Предыдущий месяц
      const { data: previousMonth } = await supabase
        .from('daily_data')
        .select('revenue')
        .eq('project_id', projectId)
        .gte('date', startOfMonth(subMonths(new Date(), 1)))
        .lte('date', endOfMonth(subMonths(new Date(), 1)));

      // Последние 7 дней (для sparkline)
      const { data: weekData } = await supabase
        .from('daily_data')
        .select('revenue, date')
        .eq('project_id', projectId)
        .gte('date', subDays(new Date(), 7))
        .order('date', { ascending: true });

      const currentRevenue = currentMonth?.reduce((sum, d) => sum + d.revenue, 0) || 0;
      const previousRevenue = previousMonth?.reduce((sum, d) => sum + d.revenue, 0) || 0;
      const currentLeads = currentMonth?.reduce((sum, d) => sum + d.leads, 0) || 0;
      const weeklyRevenue = weekData?.map(d => d.revenue) || [];

      setMetrics({
        currentRevenue,
        previousRevenue,
        currentLeads,
        planLeads: 100,
        weeklyRevenue,
      });
    };

    fetchData();
  }, [projectId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Выручка с трендом и sparkline */}
      <MetricCard
        label="Выручка за месяц"
        value={metrics.currentRevenue}
        previousValue={metrics.previousRevenue}
        sparklineData={metrics.weeklyRevenue}
        icon={<DollarSign className="w-5 h-5" />}
        variant="success"
      />

      {/* Лиды с планом */}
      <PlanFactCard
        label="Лиды"
        value={metrics.currentLeads}
        plan={metrics.planLeads}
        fact={metrics.currentLeads}
        icon={<Users className="w-5 h-5" />}
        format="number"
      />

      {/* LTV виджет */}
      <div className="md:col-span-2">
        <AverageLtvWidget projectId={projectId} />
      </div>
    </div>
  );
};
```

---

### Пример: Динамический цвет Sparkline

```tsx
import { MetricCard } from '@/components/dashboard/MetricCard';

const getSparklineColor = (trend: number) => {
  if (trend > 10) return 'rgb(34, 197, 94)'; // green
  if (trend < -10) return 'rgb(239, 68, 68)'; // red
  return 'rgb(59, 130, 246)'; // blue
};

const trend = ((currentValue - previousValue) / previousValue) * 100;

<MetricCard
  label="Продажи"
  value={currentValue}
  previousValue={previousValue}
  sparklineData={weeklyData}
  icon={<ShoppingCart className="w-5 h-5" />}
  variant={trend > 0 ? 'success' : 'danger'}
/>
```

---

## 🎨 Кастомизация

### 1. Изменить цвет прогресс-бара

```tsx
// В PlanFactCard.tsx можно кастомизировать:
<div 
  className={cn(
    "h-2 rounded-full transition-all duration-500",
    percentage >= 200 && "bg-gradient-to-r from-purple-400 to-pink-500",  // ← Свой градиент
    percentage >= 100 && percentage < 200 && "bg-success shadow-[0_0_15px_rgba(34,197,94,0.6)]",  // ← Больше glow
    percentage < 100 && "bg-blue-500"  // ← Свой цвет
  )}
  style={{ width: `${Math.min(percentage, 100)}%` }}
/>
```

---

### 2. Sparkline с заливкой

```tsx
// В Sparkline.tsx добавить:
<svg width={width} height={height}>
  {/* Заливка под графиком */}
  <polygon
    points={`0,${height} ${points} ${width},${height}`}
    fill={`${color}20`}  // ← Полупрозрачная заливка
  />
  
  {/* Линия */}
  <polyline
    points={points}
    fill="none"
    stroke={color}
    strokeWidth="2"
  />
</svg>
```

---

### 3. Кастомный TrendIndicator

```tsx
import { TrendIndicator } from '@/components/dashboard/TrendIndicator';

// Использовать напрямую в любом компоненте:
<div className="flex items-center gap-2">
  <span className="text-lg font-semibold">150 000 ₸</span>
  <TrendIndicator 
    currentValue={150000}
    previousValue={120000}
  />
</div>
// Результат: 150 000 ₸ ↑ 25%
```

---

## 🧪 Тестирование

### Тест 1: Форматирование больших чисел

```tsx
// Тест кейсы:
<MetricCard label="Test 1" value={1500000} />  // → "1.5 млн"
<MetricCard label="Test 2" value={2000000} />  // → "2 млн"
<MetricCard label="Test 3" value={499995} />   // → "499 995"
<MetricCard label="Test 4" value={150000} />   // → "150 000"
```

### Тест 2: Тренды

```tsx
// Рост:
<MetricCard value={150} previousValue={100} />  // → ↑ 50% (зеленый)

// Падение:
<MetricCard value={80} previousValue={100} />   // → ↓ 20% (красный)

// Без изменений:
<MetricCard value={100} previousValue={100} />  // → индикатор не показывается
```

### Тест 3: Прогресс-бары

```tsx
<PlanFactCard plan={100} fact={50} />   // → Синий (50%)
<PlanFactCard plan={100} fact={100} />  // → Зеленый с glow (100%)
<PlanFactCard plan={100} fact={120} />  // → Зеленый с glow (120%)
<PlanFactCard plan={100} fact={250} />  // → Градиент золото/индиго (250%)
```

---

## 📊 Best Practices

### 1. Когда использовать Sparkline:

✅ **Да:**
- Метрики, которые часто меняются (выручка, лиды, продажи)
- Данные за последние 7-14 дней
- Когда нужно показать тренд без подробного графика

❌ **Нет:**
- Статичные метрики (общее количество клиентов)
- Данные с большими колебаниями (искажают график)
- Меньше 5 точек данных

### 2. Когда использовать previousValue:

✅ **Да:**
- Сравнение с предыдущим периодом (месяц, неделя)
- Когда важно показать динамику
- Для KPI метрик

❌ **Нет:**
- Абсолютные значения без контекста
- Первая загрузка (нет предыдущих данных)

### 3. Форматирование:

```tsx
// Валюта:
<MetricCard value={150000} format="currency" />  // → "150 000 ₸"

// Число:
<MetricCard value={1500000} format="number" />   // → "1.5 млн"

// Процент:
<MetricCard value={12.5} format="percent" />     // → "12.5%"
```

---

**Готово!** Теперь можно использовать обновленные компоненты в своих дашбордах. 🚀
