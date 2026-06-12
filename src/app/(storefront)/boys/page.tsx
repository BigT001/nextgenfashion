export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ShopView } from "@/modules/products/components/shop-view/shop-view";
import { ShopViewSkeleton } from "@/modules/products/components/shop-view/shop-view-skeleton";

export default async function BoysPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  return (
    <Suspense fallback={<ShopViewSkeleton />}>
      <ShopView 
        targetGender="BOYS" 
        title="BOYS COLLECTION" 
        description="Smart, durable, and stylish outfits designed for the modern young gentleman."
        badge="Boys Selection 2026"
        category={category}
        search={q}
      />
    </Suspense>
  );
}
