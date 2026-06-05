"use client";

import { ProductCardSkeleton } from "@/modules/products/components/product-card-skeleton";

export function ShopViewSkeleton() {
  const skeletonCount = 8;
  
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-4 md:pt-8 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Filter Sidebar Skeleton */}
            <aside className="hidden lg:block lg:w-64 shrink-0">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded-full" />
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="h-3 w-20 bg-muted rounded-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Product Grid Skeleton */}
            <div className="flex-1 space-y-12">
              {/* Header skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-muted rounded-full" />
                <div className="h-10 w-40 bg-muted rounded-xl" />
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: skeletonCount }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
