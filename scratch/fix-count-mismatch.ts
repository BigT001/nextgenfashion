import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const API_KEY = "ok00wk04wcgosws0csk0k4ssw4kkow8owk8wo00w";
const BASE_URL = "https://nextgen.storeapp.com.ng/index.php/api/v1/items";

async function fix() {
  // STEP 1: Delete orphan products (products with 0 variants)
  console.log("🔍 STEP 1: Finding orphan products with 0 variants...");
  const allProducts = await prisma.product.findMany({
    include: { variants: true }
  });
  
  const orphans = allProducts.filter(p => p.variants.length === 0);
  console.log(`   Found ${orphans.length} orphan product(s).`);
  
  for (const orphan of orphans) {
    console.log(`   ❌ Deleting orphan: "${orphan.name}" (ID: ${orphan.id})`);
    await prisma.product.delete({ where: { id: orphan.id } });
  }

  // STEP 2: Get all POS item IDs
  console.log("\n📡 STEP 2: Fetching all items from POS API...");
  let offset = 0;
  const limit = 100;
  const posItemIds = new Set<string>();
  let keepFetching = true;

  while (keepFetching) {
    const url = `${BASE_URL}?limit=${limit}&offset=${offset}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json"
        }
      });
      if (res.status !== 200) break;
      const items: any = await res.json();
      if (!Array.isArray(items) || items.length === 0) {
        keepFetching = false;
        break;
      }
      items.forEach((item: any) => posItemIds.add(String(item.item_id)));
      offset += limit;
      if (offset > 5000) break;
    } catch (e) {
      console.error(e);
      break;
    }
  }
  console.log(`   POS API has ${posItemIds.size} total items.`);

  // STEP 3: Find DB variants that don't match any POS item
  console.log("\n🔍 STEP 3: Comparing DB variants against POS items...");
  const dbVariants = await prisma.productVariant.findMany({
    include: { product: true }
  });
  console.log(`   DB has ${dbVariants.length} total variants.`);

  const staleVariants = dbVariants.filter(v => {
    const match = v.sku.match(/^POS-ITEM-(\d+)$/);
    if (!match) return true;
    return !posItemIds.has(match[1]);
  });

  console.log(`   Found ${staleVariants.length} stale variant(s) not in POS.`);
  
  for (const stale of staleVariants) {
    console.log(`   ❌ Deleting stale: "${stale.product.name}" (SKU: ${stale.sku})`);
    // Delete inventory first
    await prisma.inventory.deleteMany({ where: { variantId: stale.id } });
    // Delete variant
    await prisma.productVariant.delete({ where: { id: stale.id } });
    // Delete product if no other variants
    const remaining = await prisma.productVariant.count({ where: { productId: stale.productId } });
    if (remaining === 0) {
      await prisma.product.delete({ where: { id: stale.productId } });
      console.log(`      Also deleted parent product (no variants left).`);
    }
  }

  // STEP 4: Final count verification
  console.log("\n📊 FINAL VERIFICATION:");
  const finalProducts = await prisma.product.count();
  const finalVariants = await prisma.productVariant.count();
  console.log(`   ✅ Products in DB: ${finalProducts}`);
  console.log(`   ✅ Variants in DB: ${finalVariants}`);
  console.log(`   ✅ Items in POS:   ${posItemIds.size}`);
  console.log(`   ${finalProducts === posItemIds.size ? "🎉 COUNTS MATCH PERFECTLY!" : "⚠️ Still mismatched — investigate further."}`);
}

fix()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
