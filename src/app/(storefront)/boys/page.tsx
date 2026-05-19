export const dynamic = "force-dynamic";

import { ShopView } from "@/modules/products/components/shop-view/shop-view";

export default async function BoysPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; maxPrice?: string }>;
}) {
  const { category, q, maxPrice } = await searchParams;

  return (
    <ShopView 
      targetGender="BOYS" 
      title="BOYS COLLECTION" 
      description="Smart, durable, and stylish outfits designed for the modern young gentleman."
      badge="Boys Selection 2026"
      category={category}
      search={q}
      maxPrice={maxPrice ? parseInt(maxPrice) : undefined}
    />
  );
}
