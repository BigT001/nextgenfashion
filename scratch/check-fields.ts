import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log("Prisma Models:", Object.keys(prisma));
console.log("Product fields:", (prisma as any)._dmmf.modelMap.Product.fields.map((f: any) => f.name));
