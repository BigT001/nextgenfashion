import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function heal() {
  console.log("🔍 Scanning for products with 0 active variants...");
  
  const products = await prisma.product.findMany({
    include: { variants: true }
  });
  
  let healedCount = 0;
  
  for (const product of products) {
    if (product.variants.length === 0) {
      console.log(`🛠️ Healing product "${product.name}" (ID: ${product.id})...`);
      
      const defaultSku = `NGN-${product.name.slice(0, 3).toUpperCase()}-OS-DF-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase();
      
      // Create default variant
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: defaultSku,
          size: "OS",
          color: "Default",
          price: product.basePrice
        }
      });
      
      // Create initial inventory
      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          quantity: 25, // Initialize with 25 items
          lowStockThreshold: 5
        }
      });
      
      console.log(`   ✅ Default Variant created: SKU "${defaultSku}" with 25 units!`);
      healedCount++;
    }
  }
  
  console.log(`\n🎉 Self-healing summary: ${healedCount} products repaired successfully!`);
}

heal()
  .catch(err => console.error("Error healing products:", err))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
