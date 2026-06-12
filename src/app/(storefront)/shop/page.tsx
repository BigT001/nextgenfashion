export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ShopView } from "@/modules/products/components/shop-view/shop-view";
import { ShopViewSkeleton } from "@/modules/products/components/shop-view/shop-view-skeleton";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  return (
    <Suspense fallback={<ShopViewSkeleton />}>
      <ShopView 
        category={category} 
        search={q}
      />
    </Suspense>
  );
}
