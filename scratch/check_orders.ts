import { prisma } from "../src/services/prisma.service";

async function main() {
  const sales = await prisma.sale.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      Customer: true
    }
  });
  console.log(JSON.stringify(sales, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
