import { Skeleton } from '@/components/ui/skeleton';
import { LeadCardSkeleton } from './LeadCardSkeleton';

interface KanbanColumnSkeletonProps {
  cardCount?: number;
}

export const KanbanColumnSkeleton = ({ cardCount = 3 }: KanbanColumnSkeletonProps) => {
  return (
    <div className="flex-shrink-0 w-[260px] sm:w-72 bg-muted/30 rounded-lg p-2 sm:p-3">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-2 sm:space-y-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <LeadCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
