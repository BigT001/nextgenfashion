// scripts/clear-product-images.ts
// ------------------------------------------------------------
// Clears the `images` array for every product in the Prisma DB.
// ------------------------------------------------------------
import { prisma } from '../src/services/prisma.service';

async function main() {
  const result = await prisma.product.updateMany({
    data: { images: [] }, // reset to empty array
  });
  console.log(`✅ Updated ${result.count} product(s) – images cleared.`);
}

main()
  .catch(err => {
    console.error('❌ Failed to clear images:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
