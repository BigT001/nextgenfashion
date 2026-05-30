const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true
    }
  });

  for (const p of products) {
    console.log("==========================================");
    console.log(`ID: ${p.id}`);
    console.log(`Name: ${p.name}`);
    console.log(`Description: ${p.description}`);
    console.log(`Category: ${p.category?.name}`);
    console.log(`Variants:`);
    for (const v of p.variants) {
      console.log(`  - SKU: ${v.sku}, Barcode: ${v.barcode}, Size: ${v.size}, Color: ${v.color}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
