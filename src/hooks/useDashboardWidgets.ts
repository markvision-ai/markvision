import { useState, useEffect, useCallback } from 'react';

export interface DashboardWidget {
  id: string;
  title: string;
  order: number;
  visible: boolean;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'metrics', title: 'Метрики', order: 0, visible: true },
  { id: 'computed', title: 'Расчётные показатели', order: 1, visible: true },
  { id: 'charts', title: 'Графики', order: 2, visible: true },
  { id: 'comparison', title: 'Сравнение', order: 3, visible: true },
  { id: 'appointments', title: 'Ближайшие записи', order: 4, visible: true },
];

const STORAGE_KEY = 'markvision_dashboard_widgets';

export const useDashboardWidgets = () => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_WIDGETS;
      }
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    setWidgets((prev) => {
      const newWidgets = [...prev];
      const [removed] = newWidgets.splice(fromIndex, 1);
      newWidgets.splice(toIndex, 0, removed);
      return newWidgets.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    );
  }, []);

  const resetWidgets = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return {
    widgets: sortedWidgets,
    moveWidget,
    toggleWidget,
    resetWidgets,
  };
};
