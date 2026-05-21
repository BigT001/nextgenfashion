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

async function count() {
  const products = await prisma.product.count();
  const variants = await prisma.productVariant.count();
  const categories = await prisma.category.count();
  const inventories = await prisma.inventory.count();

  console.log("📊 CURRENT DATABASE STATS:");
  console.log(`   🔹 Products: ${products}`);
  console.log(`   🔹 Product Variants: ${variants}`);
  console.log(`   🔹 Categories: ${categories}`);
  console.log(`   🔹 Inventory Rows: ${inventories}`);
}

count()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
