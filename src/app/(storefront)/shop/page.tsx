export const dynamic = "force-dynamic";

import { ShopView } from "@/modules/products/components/shop-view/shop-view";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  return (
    <ShopView 
      category={category} 
      search={q} 
    />
  );
}
