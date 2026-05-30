import { prisma } from '../src/services/prisma.service';

(async () => {
  const products = await prisma.product.findMany({
    take: 20,
    include: {
      variants: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(JSON.stringify(products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category?.name,
    variants: p.variants.map((v) => ({ sku: v.sku, barcode: v.barcode })),
  })), null, 2));
})();
