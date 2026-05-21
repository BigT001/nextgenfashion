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

async function inspect() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: true
    }
  });

  console.log(`📊 TOTAL VARIANTS IN DATABASE: ${variants.length}`);
  
  const nonPos = variants.filter(v => !v.sku.startsWith("POS-ITEM-"));
  console.log(`🔎 NON-POS SKU VARIANTS: ${nonPos.length}`);
  nonPos.forEach(v => console.log(`   - SKU: ${v.sku} | Name: ${v.product.name}`));

  // Let's also check if there are duplicate POS variants
  const posSkuMap = new Map<string, number>();
  variants.forEach(v => {
    if (v.sku.startsWith("POS-ITEM-")) {
      posSkuMap.set(v.sku, (posSkuMap.get(v.sku) || 0) + 1);
    }
  });

  const duplicates = Array.from(posSkuMap.entries()).filter(([sku, count]) => count > 1);
  console.log(`🔎 DUPLICATE POS SKUs: ${duplicates.length}`);
  duplicates.forEach(([sku, count]) => console.log(`   - SKU: ${sku} | Count: ${count}`));
}

inspect()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
