import { prisma } from "../src/services/prisma.service";

async function main() {
  const productId = "f4ed52cb-58c6-4dd0-81d2-78744861f553";
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      ProductVariant: {
        include: {
          Inventory: true
        }
      }
    }
  });

  console.log("=== PRODUCT DETAILS ===");
  console.log(JSON.stringify(product, null, 2));
}

main().catch(console.error);
