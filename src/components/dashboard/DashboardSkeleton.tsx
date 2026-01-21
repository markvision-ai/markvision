import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="premium-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16 bg-muted/50" />
              <Skeleton className="h-9 w-9 rounded-xl bg-muted/50" />
            </div>
            <Skeleton className="h-10 w-28 bg-muted/50" />
            <div className="space-y-2">
              <Skeleton className="h-1.5 w-full rounded-full bg-muted/50" />
              <Skeleton className="h-3 w-20 bg-muted/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Computed Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="premium-card p-5 space-y-3">
            <Skeleton className="h-4 w-20 bg-muted/50" />
            <Skeleton className="h-8 w-16 bg-muted/50" />
            <Skeleton className="h-3 w-24 bg-muted/30" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="premium-card p-6">
            <Skeleton className="h-5 w-32 mb-4 bg-muted/50" />
            <Skeleton className="h-[200px] w-full rounded-xl bg-muted/30" />
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="premium-card p-6">
        <Skeleton className="h-5 w-40 mb-4 bg-muted/50" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16 bg-muted/50" />
              <Skeleton className="h-6 w-20 bg-muted/50" />
              <Skeleton className="h-3 w-12 bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
