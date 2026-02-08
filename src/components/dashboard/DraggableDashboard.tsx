import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardWidgets, DashboardWidget } from '@/hooks/useDashboardWidgets';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useMemo } from 'react';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const WidgetWrapper = React.forwardRef<HTMLDivElement, WidgetWrapperProps>(
  ({ widget, children, onMoveUp, onMoveDown, isFirst, isLast }, ref) => {
    if (!widget.visible) return null;

    return (
      <div
        ref={ref}
        className="relative group mb-6"
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isFirst) onMoveUp();
                  }}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isLast) onMoveDown();
                  }}
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

        <div className="interstellar-card relative">
          {children}
        </div>
      </div>
    );
  }
);
WidgetWrapper.displayName = "WidgetWrapper";

interface WidgetContent {
  id: string;
  content: React.ReactNode;
}

interface DraggableDashboardProps {
  children: (registerWidget: (widgetId: string, content: React.ReactNode) => void) => React.ReactNode;
}

export const DraggableDashboard = ({ children }: DraggableDashboardProps) => {
  const { widgets, moveUp, moveDown, getVisiblePosition } = useDashboardWidgets();

  // Collect all widget contents first
  const widgetContents = useMemo(() => {
    const contents: WidgetContent[] = [];

    const registerWidget = (widgetId: string, content: React.ReactNode) => {
      if (widgetId && content) {
        contents.push({ id: widgetId, content });
      }
    };

    try {
      // Execute children to collect widget registrations
      children(registerWidget);
    } catch (e) {
      console.error('Error executing children in DraggableDashboard:', e);
    }

    return contents;
  }, [children]);

  // Sort widgets by their order and render
  const sortedVisibleWidgets = useMemo(() => {
    if (!widgets) return [];
    return widgets
      .filter(w => w.visible)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  const hiddenCount = widgets ? widgets.filter(w => !w.visible).length : 0;

  if (!widgets) {
    return <div className="text-red-500">Error: No widgets configuration found</div>;
  }

  return (
    <div className="space-y-6 md:pr-12">
      {/* Dashboard Info Header */}
      {hiddenCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {hiddenCount} виджет(ов) скрыто
          </span>
        </div>
      )}

      {/* Widgets Container - render in sorted order */}
      <div className="space-y-6">
        {sortedVisibleWidgets.map((widget) => {
          if (!widget || !widget.id) return null;

          const widgetContent = widgetContents.find(wc => wc.id === widget.id);
          if (!widgetContent || !widgetContent.content) {
            // Silently skip missing widgets to avoid log spam, or log debug
            return null;
          }

          const position = getVisiblePosition(widget.id);

          return (
            <WidgetWrapper
              key={widget.id}
              widget={widget}
              onMoveUp={() => moveUp(widget.id)}
              onMoveDown={() => moveDown(widget.id)}
              isFirst={position.isFirst}
              isLast={position.isLast}
            >
              {widgetContent.content}
            </WidgetWrapper>
          );
        })}
      </div>
    </div>
  );
};
