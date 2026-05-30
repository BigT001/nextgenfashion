const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching products from database...");
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true
      }
    });
    console.log(`Found ${products.length} products:`);
    for (const p of products) {
      console.log(`- ID: ${p.id}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  Category: ${p.category?.name}`);
      console.log(`  Variants: ${p.variants.map(v => v.sku).join(', ')}`);
      console.log(`  CreatedAt: ${p.createdAt}`);
    }
  } catch (err) {
    console.error("Error fetching products:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
