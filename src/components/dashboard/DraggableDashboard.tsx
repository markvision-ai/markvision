import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      {/* Arrow Controls - appear on right side on hover */}
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-1 z-20 hidden md:flex">
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

interface DraggableDashboardProps {
  children: (renderWidget: (widgetId: string, content: React.ReactNode) => React.ReactNode) => React.ReactNode;
}

export const DraggableDashboard = ({ children }: DraggableDashboardProps) => {
  const { widgets, moveUp, moveDown, getVisiblePosition } = useDashboardWidgets();

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

  const hiddenCount = widgets.filter(w => !w.visible).length;

  return (
    <div className="space-y-4 md:space-y-6 md:pr-12">
      {/* Dashboard Info Header */}
      {hiddenCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {hiddenCount} виджет(ов) скрыто
          </span>
        </div>
      )}
      
      <span className="text-xs text-muted-foreground hidden md:block">
        💡 Наведите на виджет для управления порядком (стрелки справа)
      </span>

      {/* Widgets Container */}
      <AnimatePresence mode="popLayout">
        {children(renderWidget)}
      </AnimatePresence>
    </div>
  );
};
