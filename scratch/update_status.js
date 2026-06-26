const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.sale.updateMany({
    where: {
      status: "COMPLETED",
    },
    data: {
      status: "PAID"
    }
  });
  console.log("Updated COMPLETED to PAID.");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
