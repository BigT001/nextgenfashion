import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  for (const p of products) {
    const hasImages = p.images && p.images.length > 0;
    console.log(`${p.id.substring(0, 8)} | ${p.name.substring(0, 40).padEnd(40)} | Images: ${hasImages ? p.images.length : 0}`);
    if (hasImages) {
      p.images.forEach(img => console.log(`    └─ ${img.substring(0, 100)}`));
    }
  }
}

main().catch((e)=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});
