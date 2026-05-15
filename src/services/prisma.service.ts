import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "@/lib/listeners"; // Initialize system event listeners

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const prismaClientSingleton = () => {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === "production" 
      ? { rejectUnauthorized: false } 
      : { rejectUnauthorized: false } // Supabase usually requires SSL
  });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  
  // Diagnostic: Check if costPrice is in the model
  const models = (client as any)._dmmf?.modelMap;
  if (models && models.Product) {
    const hasCostPrice = models.Product.fields.some((f: any) => f.name === "costPrice");
    console.log(`[PRISMA_SERVICE] Product model has costPrice: ${hasCostPrice}`);
  }
  
  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
