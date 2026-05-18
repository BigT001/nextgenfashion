import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const product = await prisma.product.create({
      data: {
        name: "Test Product",
        basePrice: 100,
        categoryId: "cm...", // I'll need a real ID
        targetGender: "BOTH"
      }
    });
    console.log("Success:", product);
  } catch (e) {
    console.error("Failed:", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
