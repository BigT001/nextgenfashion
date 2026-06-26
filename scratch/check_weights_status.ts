import { prisma } from "../src/services/prisma.service";

async function check() {
  const total = await prisma.product.count();
  const withWeight = await prisma.product.count({
    where: {
      weight: {
        not: null
      }
    }
  });
  const nullWeight = await prisma.product.count({
    where: {
      weight: null
    }
  });

  console.log(`Total Products: ${total}`);
  console.log(`Products with weight: ${withWeight}`);
  console.log(`Products with NULL weight: ${nullWeight}`);
  
  if (nullWeight > 0) {
    const sample = await prisma.product.findFirst({
      where: { weight: null },
      select: { id: true, name: true }
    });
    console.log(`Sample product with null weight:`, sample);
  }
}

check().catch(console.error);
