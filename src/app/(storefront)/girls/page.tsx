export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ShopView } from "@/modules/products/components/shop-view/shop-view";
import { ShopViewSkeleton } from "@/modules/products/components/shop-view/shop-view-skeleton";

export default async function GirlsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; maxPrice?: string }>;
}) {
  const { category, q, maxPrice } = await searchParams;

  return (
    <Suspense fallback={<ShopViewSkeleton />}>
      <ShopView 
        targetGender="GIRLS" 
        title="GIRLS COLLECTION" 
        description="Elegant, playful, and comfortable designs that celebrate every young girl's personality."
        badge="Girls Selection 2026"
        category={category}
        search={q}
        maxPrice={maxPrice ? parseInt(maxPrice) : undefined}
      />
    </Suspense>
  );
}
