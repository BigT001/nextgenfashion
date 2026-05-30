import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { CloudinaryService } from "../src/integrations/cloudinary/cloudinary.service";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting full product + Cloudinary purge...");

  try {
    const result = await CloudinaryService.deleteFolder("products");
    console.log("Cloudinary purge result:", result);
  } catch (error: any) {
    console.error("Cloudinary purge failed:", error?.message || error);
  }

  const variantRecords = await prisma.productVariant.findMany({ select: { id: true } });
  const variantIds = variantRecords.map((variant) => variant.id);

  if (variantIds.length > 0) {
    await prisma.saleItem.deleteMany({
      where: { variantId: { in: variantIds } }
    });
    await prisma.sale.deleteMany({
      where: { items: { none: {} } }
    });
  }

  await prisma.inventory.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.auditLog.deleteMany({
    where: { entity: { in: ["Product", "ProductVariant"] } }
  });

  console.log("Database purge complete: products, variants, audit logs, and inventory cleared.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Purge script failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
