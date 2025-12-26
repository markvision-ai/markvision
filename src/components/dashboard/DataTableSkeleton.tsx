import { Skeleton } from '@/components/ui/skeleton';

export const DataTableSkeleton = () => {
  return (
    <div className="space-y-3 md:space-y-4">
      {/* Calculated Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-3 md:p-4">
            <Skeleton className="h-3 md:h-4 w-24 mb-2" />
            <Skeleton className="h-5 md:h-7 w-20" />
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-6 w-32 md:w-44" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-24 md:w-32 rounded-lg" />
        </div>

        {/* Table */}
        <div className="p-2 md:p-3">
          {/* Header row */}
          <div className="flex gap-2 mb-3 border-b pb-2">
            <Skeleton className="h-4 w-24 flex-shrink-0" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20 flex-shrink-0" />
            ))}
          </div>

          {/* Plan row */}
          <div className="flex gap-2 mb-3 py-2 bg-primary/5 rounded-lg px-2">
            <Skeleton className="h-5 w-20 flex-shrink-0" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-16 flex-shrink-0" />
            ))}
          </div>

          {/* Fact row */}
          <div className="flex gap-2 mb-3 py-2 bg-secondary/50 rounded-lg px-2">
            <Skeleton className="h-5 w-20 flex-shrink-0" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-16 flex-shrink-0" />
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: 10 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-2 py-2 border-b border-border/50">
              <Skeleton className="h-6 w-24 flex-shrink-0" />
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 flex-shrink-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
