const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanup() {
  console.log("🧹 Cleaning up products...");
  await prisma.inventory.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("✅ Cleanup complete.");
}

cleanup()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
