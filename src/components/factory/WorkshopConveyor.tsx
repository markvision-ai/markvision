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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300 cursor-grab active:cursor-grabbing",
        "bg-[#0F0F10] backdrop-blur-md shadow-xl",
        isOverlay ? "scale-105 z-50 border-violet-500/50 shadow-[0_0_30px_-5px_rgba(139,92,246,0.5)]" : "border-white/5 hover:border-white/10 hover:shadow-lg hover:bg-[#141415]"
      )}
    >
      {/* Moving Border Effect (Simplified CSS) */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md border", getStatusColor(item.status))}>
            {getTypeIcon(item.content_type)}
          </div>
          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider h-5", getStatusColor(item.status))}>
            {item.status.replace('_', ' ')}
          </Badge>
        </div>
        {/* Progress Dots */}
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-white/40" />
          <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-white/40" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-white/90 line-clamp-2 leading-tight">
          {item.title}
        </h4>
        <p className="text-xs text-white/40 line-clamp-1">
          {(() => {
            try {
              return format(new Date(item.created_at), 'd MMM HH:mm', { locale: ru });
            } catch (e) {
              return 'Дата неизвестна';
            }
          })()}
        </p>
      </div>

      {/* Footer / Tech Details */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
        <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
           <span>ID: {item.id.slice(0, 4)}</span>
        </div>
        {item.source_url && (
            <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse" title="Source Linked" />
        )}
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
        "flex-1 min-w-[320px] h-[calc(100vh-250px)] flex flex-col rounded-2xl border transition-colors duration-300 relative overflow-hidden",
        "bg-[#050505]", // Industrial Dark Base
        isOver ? `border-${stage.color.split('-')[1]}-500/50 bg-${stage.color.split('-')[1]}-500/5` : "border-white/5"
      )}
    >
      {/* Industrial Header */}
      <div className={cn(
        "p-4 border-b border-white/5 bg-gradient-to-b relative",
        stage.bgGradient
      )}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <stage.icon className={cn("w-5 h-5", stage.color)} />
            <h3 className="font-bold text-white tracking-wide uppercase text-sm">{stage.title}</h3>
          </div>
          <Badge variant="secondary" className="bg-white/5 text-white/50 border-white/10 font-mono text-xs">
            {items.length}
          </Badge>
        </div>
        <p className="text-xs text-white/40 pl-7">{stage.subtitle}</p>
        
        {/* Active Indicator Line */}
        <div className={cn("absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent")} />
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
      <div className="p-2 border-t border-white/5 bg-[#080808] flex justify-between items-center text-[10px] text-white/20 font-mono uppercase">
         <span>SYS.STATUS: {items.length > 0 ? 'ACTIVE' : 'IDLE'}</span>
         <div className="flex gap-1">
           <div className={cn("w-1.5 h-1.5 rounded-full", items.length > 0 ? "bg-green-500 animate-pulse" : "bg-red-500/30")} />
         </div>
      </div>
    </div>
  );
};

const EmptyStageState = ({ stage }: { stage: typeof STAGES[0] }) => {
    return (
        <div className="h-[200px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl bg-white/[0.02] mt-4">
            <div className={cn("p-3 rounded-full bg-white/5 mb-3", stage.color)}>
                <Loader2 className={cn("w-6 h-6 animate-spin-slow opacity-50")} />
            </div>
            <p className="text-sm font-medium text-white/40">Цех ожидает задач</p>
            <p className="text-xs text-white/20 mt-1 font-mono">WAITING_FOR_INPUT...</p>
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
  }, []);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex gap-6 min-w-max px-2">
            {STAGES.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-6">
                    <StageColumn stage={stage} items={itemsByStage[stage.id]} />
                    
                    {/* Conveyor Belt Connection (Arrow) */}
                    {index < STAGES.length - 1 && (
                        <div className="hidden md:flex flex-col items-center justify-center opacity-30">
                            <div className="w-12 h-[2px] bg-gradient-to-r from-white/0 via-white/50 to-white/0 mb-1" />
                            <ChevronRight className="w-6 h-6 text-white animate-pulse" />
                            <div className="w-12 h-[2px] bg-gradient-to-r from-white/0 via-white/50 to-white/0 mt-1" />
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
