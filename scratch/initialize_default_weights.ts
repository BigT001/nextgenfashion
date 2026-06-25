import { prisma } from "../src/services/prisma.service";

async function initializeWeights() {
  console.log("Starting default weights initialization for products...");

  const products = await prisma.product.findMany({
    where: {
      weight: null
    },
    include: {
      categories: true
    }
  });

  console.log(`Found ${products.length} products with NULL weight.`);

  let updatedCount = 0;

  for (const product of products) {
    let weight = 0.5; // fallback default

    const categoryNames = product.categories.map(c => c.name.toLowerCase().trim());

    if (categoryNames.includes("shoes")) {
      weight = 1.2;
    } else if (
      categoryNames.includes("bags") ||
      categoryNames.includes("trolley bag") ||
      categoryNames.includes("baby carrier")
    ) {
      weight = 1.0;
    } else if (
      categoryNames.includes("blanket") ||
      categoryNames.includes("jean trousers") ||
      categoryNames.includes("joggers") ||
      categoryNames.includes("pants")
    ) {
      weight = 0.6;
    } else if (
      categoryNames.includes("towel") ||
      categoryNames.includes("pillow") ||
      categoryNames.includes("2-piece") ||
      categoryNames.includes("girls") ||
      categoryNames.includes("boys") ||
      categoryNames.includes("uni-sex")
    ) {
      weight = 0.4;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { weight }
    });

    updatedCount++;
    if (updatedCount % 20 === 0 || updatedCount === products.length) {
      console.log(`Updated ${updatedCount}/${products.length} products...`);
    }
  }

  console.log("Initialization complete!");
  const total = await prisma.product.count();
  const withWeight = await prisma.product.count({ where: { weight: { not: null } } });
  const nullWeight = await prisma.product.count({ where: { weight: null } });
  
  console.log(`Final Database Counts:`);
  console.log(`- Total Products: ${total}`);
  console.log(`- Products with weight: ${withWeight}`);
  console.log(`- Products with NULL weight: ${nullWeight}`);
}

initializeWeights().catch(console.error);
