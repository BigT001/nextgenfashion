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

async function purge() {
  console.log("🔍 Scanning for locally created test products (SKU does not start with POS-ITEM-)...");
  
  // Find all variants that do NOT start with POS-ITEM-
  const localVariants = await prisma.productVariant.findMany({
    where: {
      NOT: {
        sku: { startsWith: "POS-ITEM-" }
      }
    },
    include: {
      product: true
    }
  });

  console.log(`📦 Found ${localVariants.length} locally created test product variants.`);

  for (const variant of localVariants) {
    console.log(`❌ Deleting local test product: "${variant.product.name}" (SKU: ${variant.sku})`);
    
    // Delete associated Inventory
    await prisma.inventory.deleteMany({
      where: { variantId: variant.id }
    });

    // Delete associated ProductVariant
    await prisma.productVariant.delete({
      where: { id: variant.id }
    });

    // Delete associated Product if it has no other variants
    const productVariantsCount = await prisma.productVariant.count({
      where: { productId: variant.productId }
    });

    if (productVariantsCount === 0) {
      await prisma.product.delete({
        where: { id: variant.productId }
      });
    }
  }

  console.log("🎉 Local test product purge complete!");
}

purge()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
