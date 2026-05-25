import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "@/lib/listeners"; // Initialize system event listeners

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const getDatabaseConnectionString = () => {
  const directUrl = process.env.DIRECT_URL;
  const runtimeUrl = process.env.DATABASE_URL;

  // Prefer direct database access in development, and only use the pooled runtime URL in production.
  if (process.env.NODE_ENV !== "production") {
    return directUrl ?? runtimeUrl;
  }

  return runtimeUrl ?? directUrl;
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
