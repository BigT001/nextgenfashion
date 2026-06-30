import { prisma } from "../src/services/prisma.service";

async function main() {
  const result = await prisma.productVariant.updateMany({
    data: {
      price: null
    }
  });
  console.log(`Successfully set price = null for ${result.count} product variants so they fall back to product base price.`);
}

main().catch(console.error);
