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

async function compare() {
  console.log("📡 Fetching all items from POS API...");
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
      if (res.status !== 200) {
        console.error(`❌ Bad Status: ${res.status}`);
        break;
      }
      const items: any = await res.json();
      if (!Array.isArray(items) || items.length === 0) {
        keepFetching = false;
        break;
      }
      items.forEach(item => posItemIds.add(String(item.item_id)));
      offset += limit;
      if (offset > 5000) break;
    } catch (e) {
      console.error(e);
      break;
    }
  }

  console.log(`📊 POS API has ${posItemIds.size} total items.`);

  const dbVariants = await prisma.productVariant.findMany({
    include: { product: true }
  });

  console.log(`📊 DB has ${dbVariants.length} total variants/products.`);

  // Find DB variants whose SKU does not correspond to an active POS item id in posItemIds
  const orphans = dbVariants.filter(v => {
    const match = v.sku.match(/^POS-ITEM-(\d+)$/);
    if (!match) return true; // not a POS variant SKU
    return !posItemIds.has(match[1]);
  });

  console.log(`🔎 Found ${orphans.length} orphaned/non-matching variants in DB:`);
  orphans.forEach(o => {
    console.log(`   - SKU: ${o.sku} | Name: ${o.product.name}`);
  });

  if (orphans.length > 0) {
    console.log("🧹 Purging orphans from DB...");
    for (const orphan of orphans) {
      // delete inventory
      await prisma.inventory.deleteMany({
        where: { variantId: orphan.id }
      });
      // delete variant
      await prisma.productVariant.delete({
        where: { id: orphan.id }
      });
      // delete product if no other variants exist
      const remainingVariants = await prisma.productVariant.count({
        where: { productId: orphan.productId }
      });
      if (remainingVariants === 0) {
        await prisma.product.delete({
          where: { id: orphan.productId }
        });
      }
      console.log(`      Deleted: ${orphan.product.name} (${orphan.sku})`);
    }
    console.log("🎉 Orphans purged successfully!");
  }
}

compare()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
