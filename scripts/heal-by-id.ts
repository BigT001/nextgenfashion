import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Cloudinary credentials are not set.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  console.log('Fetching Cloudinary assets...');
  const assets: any[] = [];
  let nextCursor = undefined;
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'nextgenfashion/products',
      max_results: 500,
      next_cursor: nextCursor,
    });
    assets.push(...(Array.isArray(result.resources) ? result.resources : []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  console.log(`Discovered ${assets.length} Cloudinary assets.\n`);

  // Extract product IDs from Cloudinary filenames
  // Format: product-XXX-YYY-ZZZ-<DB_ID>-<TIMESTAMP>
  // The ID is the second-to-last part (before the timestamp)
  const productIdToUrls = new Map<string, string[]>();
  for (const asset of assets) {
    const filename = (asset.public_id || '').split('/').pop() || '';
    const parts = filename.split('-');
    // ID is at index parts.length - 2 (before the timestamp)
    if (parts.length >= 3) {
      const id = parts[parts.length - 2];
      if (id) {
        if (!productIdToUrls.has(id)) {
          productIdToUrls.set(id, []);
        }
        productIdToUrls.get(id)!.push(asset.secure_url || asset.url || '');
      }
    }
  }

  console.log(`Extracted ${productIdToUrls.size} unique product ID prefixes from Cloudinary.\n`);

  // Fetch all products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products in database.\n`);

  let linkedCount = 0;
  let processedCount = 0;

  for (const product of products) {
    // Find matching Cloudinary URLs by checking if product ID starts with any of the prefixes
    let matchedUrls: string[] = [];
    for (const [prefix, urls] of productIdToUrls.entries()) {
      if (product.id.startsWith(prefix)) {
        matchedUrls = urls;
        break;
      }
    }

    if (matchedUrls.length === 0) continue;

    const existingImages = (product.images || []) as string[];
    const newImages = matchedUrls.filter((url) => !existingImages.includes(url));

    if (newImages.length === 0) {
      console.log(`⏭️  Product ${product.name} (${product.id}) already has all images.`);
      continue;
    }

    processedCount++;

    try {
      for (const url of newImages) {
        if (existingImages.length >= 5) {
          console.log(`⏭️  Product ${product.name} already has 5 images. Skipping remaining.`);
          break;
        }

        await prisma.product.update({
          where: { id: product.id },
          data: { images: { push: url } },
        });

        linkedCount++;
        existingImages.push(url);
        console.log(`✅ Linked image to ${product.name}`);
      }
    } catch (e) {
      console.error(`❌ Failed linking images to ${product.name}:`, e);
    }
  }

  console.log(`\n✨ Healing complete!`);
  console.log(`   Processed: ${processedCount} products`);
  console.log(`   Images linked: ${linkedCount}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
