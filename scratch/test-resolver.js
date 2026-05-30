import { PrismaClient } from '@prisma/client';
import { ResolveProductImagesService } from '../src/modules/media/services/resolve-product-images.service';

const prisma = new PrismaClient();

// We need to set process.env variables so the resolve service works
process.env.CLOUDINARY_CLOUD_NAME = 'dzkcu4tqf';
process.env.CLOUDINARY_API_KEY = '344985991637156';
process.env.CLOUDINARY_API_SECRET = 'RpWQ_Cc8gsCkdLH5mgCU6Ct7XqI';

async function main() {
  console.log("Resolving products using tsx...");
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true
      }
    });

    // Resolve as a list (simulating storefront page)
    console.log("--- MULTIPLE PRODUCTS (homepage/shop list) ---");
    const resolvedList = await ResolveProductImagesService.resolve(products);
    for (const p of resolvedList) {
      console.log(`Product: ${p.name}`);
      console.log(`Resolved Image: ${p.resolvedImage}`);
      console.log(`Images array length: ${p.images.length}`);
      console.log(`Images:`, p.images);
      console.log();
    }

    // Resolve individually (simulating details page)
    console.log("--- INDIVIDUAL PRODUCTS (details page) ---");
    for (const p of products) {
      const resolved = await ResolveProductImagesService.resolve([p]);
      console.log(`Product: ${p.name}`);
      console.log(`Resolved Image: ${resolved[0].resolvedImage}`);
      console.log();
    }

  } catch (err) {
    console.error("Error in test-resolver:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
