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

async function find() {
  const products = await prisma.product.findMany({
    include: {
      variants: true
    }
  });

  console.log(`📊 Total Products: ${products.length}`);
  
  const emptyProducts = products.filter(p => p.variants.length === 0);
  console.log(`🔎 Products with 0 variants: ${emptyProducts.length}`);
  emptyProducts.forEach(p => {
    console.log(`   - ID: ${p.id} | Name: ${p.name} | CategoryId: ${p.categoryId}`);
  });

  // Let's also check if there are variants whose SKU does not start with POS-ITEM-
  const variants = await prisma.productVariant.findMany({
    include: { product: true }
  });
  const nonPos = variants.filter(v => !v.sku.startsWith("POS-ITEM-"));
  console.log(`🔎 Variants without POS-ITEM- SKU: ${nonPos.length}`);
  nonPos.forEach(v => {
    console.log(`   - ID: ${v.id} | SKU: ${v.sku} | Name: ${v.product.name}`);
  });
}

find()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
