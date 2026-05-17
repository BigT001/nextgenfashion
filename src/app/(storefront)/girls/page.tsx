export const dynamic = "force-dynamic";

import { ShopView } from "@/modules/products/components/shop-view/shop-view";

export default async function GirlsPage() {
  return (
    <ShopView 
      targetGender="GIRLS" 
      title="GIRLS COLLECTION" 
      description="Elegant, playful, and comfortable designs that celebrate every young girl's personality."
      badge="Girls Selection 2026"
    />
  );
}
