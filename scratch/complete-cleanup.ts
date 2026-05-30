import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { CloudinaryService } from "../src/integrations/cloudinary/cloudinary.service";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting complete dashboard cleanup...");

  try {
    try {
      const cloudResult = await CloudinaryService.deleteFolder("products");
      console.log("Cloudinary products folder deleted:", cloudResult);
    } catch (cloudError: any) {
      console.warn("Cloudinary cleanup warning:", cloudError?.message || cloudError);
    }

    await prisma.saleItem.deleteMany({});
    console.log("Deleted sale items.");

    await prisma.sale.deleteMany({});
    console.log("Deleted sales.");

    await prisma.customer.deleteMany({});
    console.log("Deleted customers.");

    await prisma.inventory.deleteMany({});
    console.log("Deleted inventory records.");

    await prisma.productVariant.deleteMany({});
    console.log("Deleted product variants.");

    await prisma.product.deleteMany({});
    console.log("Deleted products.");

    await prisma.category.deleteMany({});
    console.log("Deleted categories.");

    await prisma.auditLog.deleteMany({});
    console.log("Deleted audit logs.");

    console.log("Complete dashboard cleanup finished successfully.");
  } catch (error: any) {
    console.error("Complete cleanup failed:", error?.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
