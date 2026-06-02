import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Cloudinary credentials are not set in the environment.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function fetchAllAssets() {
  const assets = [];
  let nextCursor = undefined;
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'nextgenfashion/products',
      max_results: 500,
      next_cursor: nextCursor,
    });
    const resources = Array.isArray(result.resources) ? result.resources : [];
    for (const r of resources) {
      const publicId = String(r.public_id || '');
      const secureUrl = String(r.secure_url || r.url || '');
      if (publicId && secureUrl) {
        assets.push({ publicId, secureUrl });
      }
    }
    nextCursor = typeof result.next_cursor === 'string' ? result.next_cursor : undefined;
  } while (nextCursor);
  return assets;
}

const normalizeIdentifier = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const extractProductSlug = (value: string): string => {
  const withoutFolder = value.split('/').slice(-1)[0] || value;
  const withoutProductPrefix = withoutFolder.replace(/^PRODUCT-?/i, '');
  const withoutTimestamp = withoutProductPrefix.replace(/-\d{10,}$/g, '');
  return normalizeIdentifier(withoutTimestamp);
};

const tokenizeIdentifier = (value: string): string[] => {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return [];
  const segments = normalized.split('-').filter(Boolean);
  const tokens = new Set();
  for (const segment of segments) {
    if (segment.length >= 4) tokens.add(segment);
    if (/^[A-Z]+$/.test(segment) && segment.length >= 4) {
      for (let len = 4; len <= Math.min(segment.length, 5); len++) {
        tokens.add(segment.slice(0, len));
      }
    }
  }
  return Array.from(tokens) as string[];
};

async function main() {
  console.log('Fetching Cloudinary assets...');
  const assets = await fetchAllAssets();
  console.log(`Discovered ${assets.length} assets.`);

  if (assets.length === 0) {
    console.log('No assets found in Cloudinary. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Build slug -> assets map (group by extracted product slug)
  const slugToAssets = new Map();
  for (const asset of assets) {
    const slug = extractProductSlug(asset.publicId);
    const tokens = tokenizeIdentifier(slug);
    if (!slugToAssets.has(slug)) {
      slugToAssets.set(slug, []);
    }
    slugToAssets.get(slug).push({ ...asset, slug, tokens });
  }

  console.log(`Grouped assets into ${slugToAssets.size} product slugs.`);

  // Fetch all products from DB
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products in database.`);

  let linkedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    const productSlug = normalizeIdentifier(product.name);
    const assetGroup = slugToAssets.get(productSlug) || [];

    if (assetGroup.length === 0) {
      console.log(`⚠️  No Cloudinary assets found for product: ${product.name}`);
      continue;
    }

    const existingImages = (product.images || []) as string[];

    for (const asset of assetGroup) {
      if (existingImages.includes(asset.secureUrl)) {
        console.log(`⏭️  Image already linked to ${product.name}`);
        skippedCount++;
        continue;
      }

      if (existingImages.length >= 5) {
        console.log(`⏭️  Product ${product.name} already has 5 images. Skipping.`);
        skippedCount++;
        continue;
      }

      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: { push: asset.secureUrl } },
        });
        console.log(`✅ Linked image to product ${product.name}: ${asset.publicId}`);
        linkedCount++;
      } catch (e) {
        console.error(`❌ Failed linking image to ${product.name}:`, e);
      }
    }
  }

  console.log(`\n✨ Healing complete! Linked: ${linkedCount}, Skipped: ${skippedCount}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
