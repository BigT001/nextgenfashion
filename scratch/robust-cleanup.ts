import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("🧹 Executing deep catalog purge...");
  
  // Sequential deletion to respect foreign keys
  await prisma.inventory.deleteMany({});
  console.log("✅ Inventory wiped.");
  
  await prisma.productVariant.deleteMany({});
  console.log("✅ Product Variants wiped.");
  
  await prisma.product.deleteMany({});
  console.log("✅ Product Catalog wiped.");
  
  console.log("✨ Catalog is now a clean slate.");
}

cleanup()
  .catch((e) => {
    console.error("❌ Purge failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
