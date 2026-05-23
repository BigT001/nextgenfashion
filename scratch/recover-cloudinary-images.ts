import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

const normalizeIdentifier = (value: string) =>
  value
    .trim()
    .replace(/\\/g, "-")
    .replace(/\s+/g, "-")
    .replace(/\.[^.]+$/, "")
    .toUpperCase();

const findProductByIdentifier = async (identifier: string) => {
  return prisma.productVariant.findFirst({
    where: {
      OR: [
        { sku: identifier },
        { barcode: identifier },
      ],
    },
    include: {
      product: true,
    },
  });
};

const addImageToProduct = async (productId: string, imageUrl: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { images: true },
  });
  if (!product) return false;
  const currentImages = product.images ?? [];
  if (currentImages.includes(imageUrl)) return false;
  await prisma.product.update({
    where: { id: productId },
    data: { images: [...currentImages, imageUrl] },
  });
  return true;
};

const recover = async () => {
  console.log("Starting Cloudinary recovery run...");

  const folder = "nextgenfashion/products";
  const pageSize = 200;
  let nextCursor: string | undefined = undefined;
  let totalAssets = 0;
  let totalMatched = 0;
  let totalUpdated = 0;
  const unmatched: string[] = [];

  try {
    do {
      const search = cloudinary.search
        .expression(`folder:${folder} AND resource_type:image`)
        .sort_by("public_id", "asc")
        .max_results(pageSize);

      if (nextCursor) search.next_cursor(nextCursor);

      const result = await search.execute();
      const assets = result.resources || [];

      for (const asset of assets) {
        totalAssets += 1;
        const publicId = String(asset.public_id || "");
        const normalized = normalizeIdentifier(publicId.replace(`${folder}/`, ""));
        const secureUrl = String(asset.secure_url || asset.url || "");

        if (!secureUrl) {
          unmatched.push(`${publicId} (missing url)`);
          continue;
        }

        const variant = await findProductByIdentifier(normalized);
        if (!variant || !variant.product) {
          unmatched.push(publicId);
          continue;
        }

        totalMatched += 1;
        const updated = await addImageToProduct(variant.product.id, secureUrl);
        if (updated) {
          totalUpdated += 1;
          console.log(`Added image for product ${variant.product.id} (${variant.product.name}) from asset ${publicId}`);
        }
      }

      nextCursor = result.next_cursor || undefined;
    } while (nextCursor);
  } catch (error) {
    console.error("Recovery failed:", error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nRecovery summary:");
  console.log(`  total assets scanned: ${totalAssets}`);
  console.log(`  total matched assets: ${totalMatched}`);
  console.log(`  total products updated: ${totalUpdated}`);
  console.log(`  total unmatched assets: ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.log("\nUnmatched asset public IDs:");
    unmatched.slice(0, 100).forEach((id) => console.log(`  - ${id}`));
    if (unmatched.length > 100) console.log(`  ...and ${unmatched.length - 100} more`);
  }
};

recover().catch((error) => {
  console.error(error);
  process.exit(1);
});
