import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { ProductVariant: { include: { Inventory: true } }, Category: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('id,name,isSuspended,categoryId,categoryName,targetGender,createdAt,variantsCount,totalStock');
  for (const p of products) {
    const variants = p.ProductVariant || [];
    const totalStock = variants.reduce((acc: number, v: any) => acc + (v.Inventory ? v.Inventory.quantity : 0), 0);
    console.log(`${p.id},"${p.name.replace(/"/g,'""')}",${p.isSuspended},${p.categoryId},"${p.Category?.name||''}",${p.targetGender||''},${p.createdAt.toISOString()},${variants.length},${totalStock}`);
  }
}

main().catch((e)=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});
