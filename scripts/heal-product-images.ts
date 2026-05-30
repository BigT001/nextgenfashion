// scripts/heal-product-images.ts
// This script iterates over all Cloudinary image assets for the NextGenFashion project,
// matches them to product variants using existing matching logic, and persists the
// image URLs into the product's `images` array via LinkProductImageService.

import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../src/services/prisma.service";
import { MatchImageFilenamesService } from "../src/modules/products/services/match-image-filenames.service";
import { LinkProductImageService } from "../src/modules/products/services/link-product-image.service";

config(); // Load .env variables

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Cloudinary credentials are not set in the environment.");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function fetchAllAssets(): Promise<Array<{ publicId: string; secureUrl: string }>> {
  const assets: Array<{ publicId: string; secureUrl: string }> = [];
  let nextCursor: string | undefined;
  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: "nextgenfashion/products",
      max_results: 500,
      next_cursor: nextCursor,
    });
    const resources = Array.isArray(result.resources) ? result.resources : [];
    for (const r of resources) {
      const publicId = String(r.public_id || "");
      const secureUrl = String(r.secure_url || r.url || "");
      if (publicId && secureUrl) {
        assets.push({ publicId, secureUrl });
      }
    }
    nextCursor = typeof result.next_cursor === "string" ? result.next_cursor : undefined;
  } while (nextCursor);
  return assets;
}

async function main() {
  console.log("Fetching Cloudinary assets...");
  const assets = await fetchAllAssets();
  console.log(`Discovered ${assets.length} assets.`);

  // Build filename -> secureUrl map (filename without extension)
  const filenameToUrl = new Map<string, string>();
  for (const asset of assets) {
    const lastDot = asset.publicId.lastIndexOf(".");
    const baseName = lastDot !== -1 ? asset.publicId.substring(0, lastDot) : asset.publicId;
    filenameToUrl.set(baseName.trim(), asset.secureUrl);
  }

  // Run existing matching service on the list of filenames
  const filenames = Array.from(filenameToUrl.keys());
  const { matched, unmatched } = await MatchImageFilenamesService.execute(filenames);

  console.log(`Matched ${matched.length} assets to products, ${unmatched.length} unmatched.`);

  for (const m of matched) {
    const imageUrl = filenameToUrl.get(m.filename);
    if (!imageUrl) continue; // safety
    try {
      await LinkProductImageService.execute(m.productId, imageUrl);
      console.log(`✅ Linked image to product ${m.productId}`);
    } catch (e) {
      console.error(`❌ Failed linking image to product ${m.productId}:`, e);
    }
  }

  console.log("Healing script completed.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Unexpected error in healing script:", e);
  process.exit(1);
});
