import { useState } from 'react';
import { ChevronUp, ChevronDown, Settings2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useDashboardWidgets, DashboardWidget } from '@/hooks/useDashboardWidgets';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const WidgetWrapper = ({ widget, children, onMoveUp, onMoveDown, isFirst, isLast }: WidgetWrapperProps) => {
  if (!widget.visible) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      {/* Arrow Controls - hidden on mobile, appear on hover on desktop */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-1 z-20 hidden md:flex">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border-border/50 shadow-sm",
                  isFirst && "opacity-30 cursor-not-allowed"
                )}
                onClick={onMoveUp}
                disabled={isFirst}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Переместить вверх</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border-border/50 shadow-sm",
                  isLast && "opacity-30 cursor-not-allowed"
                )}
                onClick={onMoveDown}
                disabled={isLast}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Переместить вниз</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {children}
    </motion.div>
  );
};

interface WidgetSettingsItemProps {
  widget: DashboardWidget;
  onToggle: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const WidgetSettingsItem = ({ widget, onToggle, onMoveUp, onMoveDown, isFirst, isLast }: WidgetSettingsItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveUp}
            disabled={isFirst}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveDown}
            disabled={isLast}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
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
  const { widgets, moveUp, moveDown, toggleWidget, resetWidgets, getVisiblePosition } = useDashboardWidgets();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const renderWidget = (widgetId: string, content: React.ReactNode) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || !widget.visible) return null;

    const position = getVisiblePosition(widgetId);

    return (
      <WidgetWrapper
        key={widget.id}
        widget={widget}
        onMoveUp={() => moveUp(widgetId)}
        onMoveDown={() => moveDown(widgetId)}
        isFirst={position.isFirst}
        isLast={position.isLast}
      >
        {content}
      </WidgetWrapper>
    );
  };

  const visibleWidgets = widgets.filter(w => w.visible);
  const hiddenCount = widgets.filter(w => !w.visible).length;

  return (
    <div className="space-y-4 md:space-y-6 md:pl-12">
      {/* Dashboard Settings Header */}
      <div className="flex items-center justify-between md:-ml-12 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {hiddenCount} виджет(ов) скрыто
            </span>
          )}
          <span className="text-xs text-muted-foreground hidden md:inline">
            💡 Наведите на виджет для управления порядком
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hover:border-primary">
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Настроить виджеты</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Настройка виджетов дашборда</SheetTitle>
                <SheetDescription>
                  Используйте стрелки для изменения порядка и переключатели для видимости
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  {widgets.map((widget, index) => (
                    <WidgetSettingsItem
                      key={widget.id}
                      widget={widget}
                      onToggle={toggleWidget}
                      onMoveUp={() => moveUp(widget.id)}
                      onMoveDown={() => moveDown(widget.id)}
                      isFirst={index === 0}
                      isLast={index === widgets.length - 1}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetWidgets();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full gap-2 mt-4"
                >
                  <RotateCcw className="w-4 h-4" />
                  Сбросить порядок
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Widgets Container */}
      <AnimatePresence mode="popLayout">
        {children(renderWidget)}
      </AnimatePresence>
    </div>
  );
};
