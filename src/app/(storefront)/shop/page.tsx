export const dynamic = "force-dynamic";

import { ShopView } from "@/modules/products/components/shop-view/shop-view";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; maxPrice?: string }>;
}) {
  const { category, q, maxPrice } = await searchParams;

  return (
    <ShopView 
      category={category} 
      search={q} 
      maxPrice={maxPrice ? parseInt(maxPrice) : undefined}
    />
  );
}
