import { Skeleton } from "@/components/ui/skeleton";

export const KanbanBoardSkeleton = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
      {[...Array(5)].map((_, colIndex) => (
        <div
          key={colIndex}
          className="flex-shrink-0 w-[300px] md:w-[320px] bg-card/50 rounded-2xl p-4 border border-border/30"
        >
          {/* Column header skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>

          {/* Card skeletons */}
          <div className="space-y-3">
            {[...Array(3)].map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="bg-background rounded-xl p-4 border border-border/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
