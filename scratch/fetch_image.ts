import { prisma } from "../src/services/prisma.service";
async function main() {
  const product = await prisma.product.findFirst({
    where: { images: { isEmpty: false } },
    select: { images: true }
  });
  console.log(JSON.stringify(product));
}
main();
