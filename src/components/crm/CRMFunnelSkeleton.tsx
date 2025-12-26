import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const CRMFunnelSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:pt-4 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-6 md:h-8 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1 md:space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton 
                  className="h-8 md:h-10 rounded-lg" 
                  style={{ width: `${100 - i * 30}%` }}
                />
              </div>
            ))}
          </div>

          {/* Conversion Arrow */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
