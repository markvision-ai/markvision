import { useState, useEffect, useCallback } from 'react';

export interface DashboardWidget {
  id: string;
  title: string;
  order: number;
  visible: boolean;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'metrics', title: 'Выручка и Метрики', order: 0, visible: true },
  { id: 'computed', title: 'Расчётные показатели', order: 1, visible: true },
  { id: 'charts', title: 'Воронка и Графики', order: 2, visible: true },
  { id: 'comparison', title: 'Сравнение с прошлым', order: 3, visible: true },
  { id: 'appointments', title: 'Календарь и Записи', order: 4, visible: true },
  { id: 'ai-assistant', title: 'ИИ-Аналитик', order: 5, visible: true },
];

// Use the key from user's request
const STORAGE_KEY = 'mvi_dashboard_layout';

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
        return mergedWidgets;
      } catch {
        return DEFAULT_WIDGETS;
      }
    }
    return DEFAULT_WIDGETS;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Save to localStorage whenever widgets change
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
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const applyLayout = useCallback(() => {
    // Layout is auto-saved, this just exits edit mode
    setIsEditMode(false);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return {
    widgets: sortedWidgets,
    moveWidget,
    toggleWidget,
    resetWidgets,
    isEditMode,
    setIsEditMode,
    applyLayout,
    startEditing,
  };
};
