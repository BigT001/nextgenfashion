// scripts/clear-product-images.js
// Clears the `images` array on every Product row in the database.
// Run with: node scripts/clear-product-images.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching all products...');
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  console.log(`📦 Found ${products.length} product(s) in the database.`);

  const withImages = products.filter(p => p.images && p.images.length > 0);
  console.log(`🖼️  ${withImages.length} product(s) have stored image URLs.`);

  if (withImages.length === 0) {
    console.log('✅ Nothing to clear — all products already have empty image arrays.');
    return;
  }

  // Print what we're about to clear
  for (const p of withImages) {
    console.log(`  → [${p.id}] "${p.name}" — ${p.images.length} image(s)`);
    for (const url of p.images) {
      console.log(`      • ${url}`);
    }
  }

  console.log('\n🧹 Clearing images for all products...');
  const result = await prisma.product.updateMany({
    data: { images: [] },
  });

  console.log(`✅ Done! Cleared images from ${result.count} product(s).`);
  console.log('\nYou can now upload fresh images for each product — they will be unique to that product.');
}

main()
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
