import { prisma } from "../src/services/prisma.service";

async function main() {
  const products = await prisma.product.findMany({
    take: 5,
    include: {
      variants: true
    }
  });
  console.log("Products in DB:", JSON.stringify(products, null, 2));
}

main().catch(console.error);
