"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="group cursor-wait">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-square rounded-xl mb-3" />
      
      {/* Title skeleton */}
      <Skeleton className="h-4 w-3/4 rounded-full mb-2" />
      
      {/* Price skeleton */}
      <Skeleton className="h-5 w-1/2 rounded-full" />
    </div>
  );
}
