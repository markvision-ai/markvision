import { Skeleton } from '@/components/ui/skeleton';

export const LeadCardSkeleton = () => {
  return (
    <div className="bg-background border rounded-lg p-2 sm:p-3">
      {/* Header with grip and name */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Phone */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <Skeleton className="w-3 h-3 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <Skeleton className="w-3 h-3 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Button */}
      <Skeleton className="h-6 sm:h-7 w-full rounded" />
    </div>
  );
};
