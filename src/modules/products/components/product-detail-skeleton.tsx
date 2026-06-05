"use client";

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image gallery skeleton */}
          <div className="space-y-4">
            <div className="w-full aspect-square rounded-2xl bg-muted animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </div>

          {/* Product details skeleton */}
          <div className="space-y-6">
            {/* Title */}
            <div className="h-8 w-3/4 bg-muted rounded-lg animate-pulse" />
            
            {/* Price */}
            <div className="h-7 w-1/3 bg-muted rounded-lg animate-pulse" />
            
            {/* Rating */}
            <div className="h-4 w-1/4 bg-muted rounded-lg animate-pulse" />
            
            {/* Description */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded-lg animate-pulse" />
              ))}
              <div className="h-4 w-2/3 bg-muted rounded-lg animate-pulse" />
            </div>

            {/* Variants section */}
            <div className="space-y-4">
              {/* Size selector */}
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded-lg animate-pulse" />
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Add to cart button */}
            <div className="h-12 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
