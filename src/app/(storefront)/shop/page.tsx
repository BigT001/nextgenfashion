export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ShopView } from "@/modules/products/components/shop-view/shop-view";
import { ShopViewSkeleton } from "@/modules/products/components/shop-view/shop-view-skeleton";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; maxPrice?: string }>;
}) {
  const { category, q, maxPrice } = await searchParams;

  return (
    <Suspense fallback={<ShopViewSkeleton />}>
      <ShopView 
        category={category} 
        search={q} 
        maxPrice={maxPrice ? parseInt(maxPrice) : undefined}
      />
    </Suspense>
  );
}
