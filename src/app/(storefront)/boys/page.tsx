export const dynamic = "force-dynamic";

import { ShopView } from "@/modules/products/components/shop-view/shop-view";

export default async function BoysPage() {
  return (
    <ShopView 
      targetGender="BOYS" 
      title="BOYS COLLECTION" 
      description="Smart, durable, and stylish outfits designed for the modern young gentleman."
      badge="Boys Selection 2026"
    />
  );
}
