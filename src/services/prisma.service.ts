import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "@/lib/listeners"; // Initialize system event listeners

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const getDatabaseConnectionString = () => {
  if (process.env.NODE_ENV !== "production") {
    return process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  }
  return process.env.DATABASE_URL ?? process.env.DIRECT_URL;
};

const prismaClientSingleton = () => {
  const connectionString = getDatabaseConnectionString();

  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is not defined. Check your .env configuration.");
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const client = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"]
  });

  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
