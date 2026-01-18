import { useState, useEffect, useCallback } from 'react';

export interface DashboardWidget {
  id: string;
  title: string;
  order: number;
  visible: boolean;
}

// Эталонный порядок виджетов - полный список
const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'metrics', title: 'Выручка и Метрики', order: 0, visible: true },
  { id: 'computed', title: 'Расчётные показатели', order: 1, visible: true },
  { id: 'ltv-widget', title: 'Средний LTV клиента', order: 2, visible: true },
  { id: 'quick-stats', title: 'Сравнение с прошлой неделей', order: 3, visible: true },
  { id: 'revenue-chart', title: 'Динамика (Расходы vs Выручка)', order: 4, visible: true },
  { id: 'conversions', title: 'Воронка продаж', order: 5, visible: true },
  { id: 'appointments', title: 'Записи на неделю', order: 6, visible: true },
  { id: 'ai-assistant', title: 'ИИ-Аналитик', order: 7, visible: true },
];

// Ключ для localStorage - v4 для добавления LTV виджета
const STORAGE_KEY = 'dashboard_order_v4';

export const useDashboardWidgets = () => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new widgets
        const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
          const savedWidget = parsed.find((w: DashboardWidget) => w.id === defaultWidget.id);
          return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
        });
        return mergedWidgets.sort((a, b) => a.order - b.order);
      } catch {
        return DEFAULT_WIDGETS;
      }
    }
    return DEFAULT_WIDGETS;
  });

  // Save to localStorage whenever widgets change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  // Переместить виджет вверх
  const moveUp = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === widgetId);
      if (index <= 0) return prev; // Уже наверху
      
      const newWidgets = [...prev];
      // Swap with previous
      [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
      // Update order
      return newWidgets.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  // Переместить виджет вниз
  const moveDown = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === widgetId);
      if (index < 0 || index >= prev.length - 1) return prev; // Уже внизу
      
      const newWidgets = [...prev];
      // Swap with next
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      // Update order
      return newWidgets.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    );
  }, []);

  const resetWidgets = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Получить позицию виджета среди видимых
  const getVisiblePosition = useCallback((widgetId: string) => {
    const visibleWidgets = widgets.filter(w => w.visible);
    const index = visibleWidgets.findIndex(w => w.id === widgetId);
    return {
      index,
      isFirst: index === 0,
      isLast: index === visibleWidgets.length - 1,
      total: visibleWidgets.length
    };
  }, [widgets]);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return {
    widgets: sortedWidgets,
    moveUp,
    moveDown,
    toggleWidget,
    resetWidgets,
    getVisiblePosition,
  };
};
