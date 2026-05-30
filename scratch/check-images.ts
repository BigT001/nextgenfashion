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

async function check() {
  const productsWithImages = await prisma.product.findMany({
    where: {
      images: {
        isEmpty: false
      }
    },
    select: {
      id: true,
      name: true,
      images: true,
      variants: {
        select: {
          sku: true
        }
      }
    }
  });

  console.log(`🔍 Found ${productsWithImages.length} products with images in local DB:`);
  productsWithImages.forEach(p => {
    console.log(`- Product: "${p.name}" (ID: ${p.id})`);
    console.log(`  SKUs: ${p.variants.map(v => v.sku).join(", ")}`);
    console.log(`  Images:`, p.images);
  });
}

check()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
