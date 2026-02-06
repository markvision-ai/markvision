import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, 
  DragOverlay, 
  useSensors, 
  useSensor, 
  PointerSensor, 
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Upload,
  BrainCircuit,
  Rocket,
  ChevronRight,
  Loader2,
  Video,
  Image,
  Type,
  MessageCircle,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ContentItem, ContentStatus } from '@/hooks/useContentFactory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Industrial styling constants
const CONVEYOR_SPEED = 2; // seconds

interface WorkshopConveyorProps {
  content: ContentItem[];
  projectId: string | null;
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

// Stage Definition
const STAGES = [
  {
    id: 'stage-1',
    title: 'Загрузка',
    subtitle: 'Идеи и сценарии',
    icon: Upload,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgGradient: 'from-blue-500/10 to-transparent',
    statuses: ['ideation', 'scripting'] as ContentStatus[],
  },
  {
    id: 'stage-2',
    title: 'AI Анализ',
    subtitle: 'Генерация и монтаж',
    icon: BrainCircuit,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgGradient: 'from-violet-500/10 to-transparent',
    statuses: ['voice_ready', 'avatar_ready', 'editing_ready'] as ContentStatus[],
  },
  {
    id: 'stage-3',
    title: 'Готово',
    subtitle: 'Публикация',
    icon: Rocket,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-500/10 to-transparent',
    statuses: ['ready_to_send', 'sent'] as ContentStatus[],
  }
];

// Helper to get stage for item
const getStageId = (status: ContentStatus) => {
  const stage = STAGES.find(s => s.statuses.includes(status));
  return stage ? stage.id : 'stage-1';
};

// --- Components ---

// 1. Draggable Card
const DraggableContentCard = ({ item, isOverlay = false }: { item: ContentItem; isOverlay?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, data: { item } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const getStatusColor = (status: ContentStatus) => {
    if (['ready_to_send', 'sent'].includes(status)) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (['voice_ready', 'avatar_ready', 'editing_ready'].includes(status)) return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'avatar_video': return <Video className="w-3 h-3" />;
      case 'static_post': return <Image className="w-3 h-3" />;
      default: return <Type className="w-3 h-3" />;
    }
  };

  const handleMoveNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    // Logic to move to next stage will be handled by parent or passed down
    // For now, we'll emit a custom event or use a callback if we refactor props
    // But since we are inside DraggableContentCard which is used by Sortable, passing props is tricky without context
    // Let's use a simpler approach: The parent WorkshopConveyor can pass a function to DraggableContentCard
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex flex-col gap-2 p-3 rounded-xl border transition-all duration-300 cursor-grab active:cursor-grabbing",
        "bg-card/90 backdrop-blur-sm shadow-sm",
        isOverlay ? "scale-105 z-50 border-primary/50 shadow-xl" : "border-border/50 hover:border-primary/20 hover:shadow-md hover:bg-card"
      )}
    >
      {/* Moving Border Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header: Type & Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1 rounded-md border bg-background/50", getStatusColor(item.status))}>
            {getTypeIcon(item.content_type)}
          </div>
          <Badge variant="secondary" className={cn("text-[9px] uppercase tracking-wider h-4 px-1.5 font-medium border-0", getStatusColor(item.status))}>
            {item.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Content: Title & Preview */}
      <div className="flex gap-3 items-start">
         {/* Preview Image (Placeholder or Real) */}
          <div className="w-12 h-12 rounded-lg bg-muted/50 flex-shrink-0 overflow-hidden border border-border/50 relative group-hover:border-primary/20 transition-colors">
             {(item as any).thumbnail_url ? (
                 <img src={(item as any).thumbnail_url} alt="" className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                     {getTypeIcon(item.content_type)}
                 </div>
             )}
             {/* Play overlay if video */}
            {item.content_type === 'avatar_video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-4 h-4 rounded-full bg-foreground/90 shadow-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-black border-b-[3px] border-b-transparent ml-0.5" />
                    </div>
                </div>
            )}
         </div>

         <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1 tracking-tight">
              {item.title}
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1 font-mono">
              {(() => {
                try {
                  return format(new Date(item.created_at), 'd MMM HH:mm', { locale: ru });
                } catch (e) {
                  return 'Дата неизвестна';
                }
              })()}
            </p>
         </div>
      </div>

      {/* Footer: Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
         <div className="text-[9px] text-muted-foreground/50 font-mono">
             ID: {item.id.slice(0, 4)}
         </div>
         <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] px-2 hover:bg-primary/5 text-muted-foreground hover:text-primary gap-1 font-medium transition-colors"
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag
            onClick={(e) => {
                // We need to trigger the move next action.
                // Since we can't easily pass the handler down through SortableContext without a custom wrapper,
                // we'll dispatch a custom event that the parent listens to.
                const event = new CustomEvent('move-next-stage', { detail: { id: item.id } });
                window.dispatchEvent(event);
            }}
         >
            Дальше <ChevronRight className="w-3 h-3" />
         </Button>
      </div>
    </div>
  );
};

// 2. Stage Column (The "Machine")
const StageColumn = ({ stage, items }: { stage: typeof STAGES[0]; items: ContentItem[] }) => {
  const { setNodeRef, isOver } = useSortable({
    id: stage.id,
    data: { type: 'stage', stageId: stage.id }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[320px] h-[calc(100vh-250px)] flex flex-col rounded-2xl border transition-all duration-300 relative overflow-hidden group/stage",
        "bg-muted/30 backdrop-blur-sm", 
        isOver ? "border-primary/30 bg-primary/5 shadow-inner" : "border-border/40"
      )}
    >
      {/* Apple-style Header */}
      <div className={cn(
        "p-4 border-b border-border/40 bg-card/40 backdrop-blur-md relative",
        // stage.bgGradient
      )}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg bg-background shadow-sm border border-border/50", stage.color)}>
              <stage.icon className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground tracking-tight text-sm">{stage.title}</h3>
          </div>
          <Badge variant="secondary" className="bg-background/50 text-muted-foreground border-border/50 font-mono text-xs shadow-sm">
            {items.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground/70 pl-9">{stage.subtitle}</p>
        
        {/* Active Indicator Line */}
        <div className={cn("absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-50")} />
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3 overflow-hidden relative">
        <ScrollArea className="h-full pr-3">
          <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-col gap-3 pb-4">
              {items.length > 0 ? (
                 items.map(item => (
                   <DraggableContentCard key={item.id} item={item} />
                 ))
              ) : (
                <EmptyStageState stage={stage} />
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
      
      {/* Machine Status Footer */}
      <div className="p-2 border-t border-border/40 bg-card/30 flex justify-between items-center text-[10px] text-muted-foreground/60 font-mono uppercase backdrop-blur-sm">
         <span>STATUS: {items.length > 0 ? 'ACTIVE' : 'IDLE'}</span>
         <div className="flex gap-1">
           <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", items.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
         </div>
      </div>
    </div>
  );
};

const EmptyStageState = ({ stage }: { stage: typeof STAGES[0] }) => {
    return (
        <div className="h-[200px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/40 rounded-xl bg-background/20 mt-4 mx-2">
            <div className={cn("p-3 rounded-full bg-background shadow-sm border border-border/50 mb-3", stage.color)}>
                <Loader2 className={cn("w-5 h-5 animate-spin-slow opacity-50")} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Ожидание задач</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono tracking-wider">WAITING_FOR_INPUT...</p>
        </div>
    )
}


// --- Main Conveyor Component ---
export const WorkshopConveyor = ({ content, projectId, onUpdate }: WorkshopConveyorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags
      },
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // Group items by stage
  const itemsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = content.filter(item => getStageId(item.status) === stage.id);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = content.find(i => i.id === active.id);
    if (!activeItem) return;

    // Determine Target Stage
    // 'over' can be a StageColumn (droppable) or another Card (sortable)
    let targetStageId = over.id as string;
    
    // If dropped on a card, find that card's stage
    if (!STAGES.find(s => s.id === targetStageId)) {
       const overItem = content.find(i => i.id === over.id);
       if (overItem) {
         targetStageId = getStageId(overItem.status);
       }
    }

    const currentStageId = getStageId(activeItem.status);

    if (currentStageId !== targetStageId) {
        // Find default status for the new stage
        const targetStage = STAGES.find(s => s.id === targetStageId);
        if (targetStage) {
            const newStatus = targetStage.statuses[0]; // Default to first status of stage
            
            // Optimistic update locally? 
            // We rely on parent state update, but we trigger the async call
            
            toast.promise(
                onUpdate(activeItem.id, { status: newStatus }),
                {
                    loading: 'Перемещение...',
                    success: `Перемещено в ${targetStage.title}`,
                    error: 'Ошибка перемещения'
                }
            );
        }
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleMoveNextEvent = (e: Event) => {
        const customEvent = e as CustomEvent;
        const itemId = customEvent.detail.id;
        const item = content.find(i => i.id === itemId);
        if (item) {
            const currentStageId = getStageId(item.status);
            const currentStageIndex = STAGES.findIndex(s => s.id === currentStageId);
            if (currentStageIndex < STAGES.length - 1) {
                const nextStage = STAGES[currentStageIndex + 1];
                const newStatus = nextStage.statuses[0];
                toast.promise(
                    onUpdate(item.id, { status: newStatus }),
                    {
                        loading: 'Перемещение...',
                        success: `Перемещено в ${nextStage.title}`,
                        error: 'Ошибка перемещения'
                    }
                );
            }
        }
    };

    window.addEventListener('move-next-stage', handleMoveNextEvent);
    return () => {
        window.removeEventListener('move-next-stage', handleMoveNextEvent);
    };
  }, [content, onUpdate]);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex gap-4 min-w-max px-2 h-full">
            {STAGES.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-4 h-full">
                    <StageColumn stage={stage} items={itemsByStage[stage.id]} />
                    
                    {/* Conveyor Belt Connection (Tracing Beam Style) */}
                    {index < STAGES.length - 1 && (
                        <div className="hidden md:flex flex-col items-center justify-center h-full opacity-50 relative w-8">
                            {/* Animated Beam */}
                            <div className="absolute inset-y-0 left-1/2 w-[2px] bg-gradient-to-b from-transparent via-white/20 to-transparent">
                                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-violet-500 to-transparent animate-beam-drop" />
                            </div>
                            
                            <div className="z-10 bg-[#030303] p-1 rounded-full border border-white/10">
                                <ChevronRight className="w-4 h-4 text-white/50" />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {mounted && createPortal(
        <DragOverlay>
          {activeId ? (
             <DraggableContentCard 
               item={content.find(i => i.id === activeId)!} 
               isOverlay 
             />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};
