import { prisma } from "../src/services/prisma.service";

async function listCategories() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          Product: true
        }
      }
    }
  });

  console.log("Categories in Database:");
  categories.forEach(c => {
    console.log(`- ${c.name} (ID: ${c.id}): ${c._count.Product} products`);
  });
}

listCategories().catch(console.error);
