import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useDashboardWidgets, DashboardWidget } from '@/hooks/useDashboardWidgets';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
  widget: DashboardWidget;
  children: React.ReactNode;
}

const SortableWidget = ({ widget, children }: SortableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!widget.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 opacity-90'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-secondary hover:bg-muted z-10"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
};

interface WidgetSettingsItemProps {
  widget: DashboardWidget;
  onToggle: (id: string) => void;
}

const WidgetSettingsItem = ({ widget, onToggle }: WidgetSettingsItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium">{widget.title}</span>
      </div>
      <Switch
        checked={widget.visible}
        onCheckedChange={() => onToggle(widget.id)}
      />
    </div>
  );
};

interface DraggableDashboardProps {
  children: (renderWidget: (widgetId: string, content: React.ReactNode) => React.ReactNode) => React.ReactNode;
}

export const DraggableDashboard = ({ children }: DraggableDashboardProps) => {
  const { widgets, moveWidget, toggleWidget, resetWidgets } = useDashboardWidgets();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      moveWidget(oldIndex, newIndex);
    }
  };

  const renderWidget = (widgetId: string, content: React.ReactNode) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget || !widget.visible) return null;

    return (
      <SortableWidget key={widget.id} widget={widget}>
        {content}
      </SortableWidget>
    );
  };

  const visibleWidgets = widgets.filter(w => w.visible);
  const hiddenCount = widgets.filter(w => !w.visible).length;

  return (
    <div className="space-y-6">
      {/* Dashboard Settings Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {hiddenCount} виджет(ов) скрыто
            </span>
          )}
        </div>
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Настроить виджеты</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Настройка виджетов дашборда</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Перетаскивайте виджеты для изменения порядка. Используйте переключатели для скрытия/отображения.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={widgets.map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {widgets.map((widget) => (
                      <WidgetSettingsItem
                        key={widget.id}
                        widget={widget}
                        onToggle={toggleWidget}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetWidgets}
                className="w-full gap-2 mt-4"
              >
                <RotateCcw className="w-4 h-4" />
                Сбросить расположение
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Draggable Widgets Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          {children(renderWidget)}
        </SortableContext>
      </DndContext>
    </div>
  );
};
