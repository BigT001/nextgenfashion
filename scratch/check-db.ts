import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const count = await prisma.product.count();
  console.log(`📊 Current Product Count: ${count}`);
  const products = await prisma.product.findMany({ select: { name: true, id: true } });
  console.log("📝 Products:", JSON.stringify(products, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
