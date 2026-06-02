import { prisma } from "../src/services/prisma.service";

async function main() {
  console.log("Checking products for missing or zero inventory (relative import)...");

  const totalProducts = await prisma.product.count({ where: { isSuspended: false } });
  console.log(`Total active products: ${totalProducts}`);

  const products = await prisma.product.findMany({
    where: { isSuspended: false },
    include: { ProductVariant: { include: { Inventory: true } } },
  });

  const zeroStock = [] as any[];
  const missingInventory = [] as any[];

  for (const p of products) {
    const variants = p.ProductVariant || [];
    const totalStock = variants.reduce((acc: number, v: any) => acc + (v.Inventory ? v.Inventory.quantity : 0), 0);
    const variantsWithoutInventory = variants.filter((v: any) => !v.Inventory).length;

    if (variantsWithoutInventory > 0) {
      missingInventory.push({ id: p.id, name: p.name, variantsCount: variants.length, variantsWithoutInventory });
    }

    if (totalStock === 0) {
      zeroStock.push({ id: p.id, name: p.name, variantsCount: variants.length, totalStock });
    }
  }

  console.log(`Products with at least one variant missing Inventory: ${missingInventory.length}`);
  missingInventory.slice(0, 50).forEach((p) => console.log(` - ${p.id} | ${p.name} | variants: ${p.variantsCount} | missingInventory: ${p.variantsWithoutInventory}`));

  console.log(`\nProducts with total stock == 0: ${zeroStock.length}`);
  zeroStock.slice(0, 50).forEach((p) => console.log(` - ${p.id} | ${p.name} | variants: ${p.variantsCount} | stock: ${p.totalStock}`));

  console.log("\nSummary: If many products show missing Inventory, re-run the import or ensure inventory rows are created when uploading variants.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
