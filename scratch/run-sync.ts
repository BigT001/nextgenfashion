import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const enableLegacySync = process.env.ENABLE_LEGACY_POS_SYNC === "true";

if (!enableLegacySync) {
  console.warn("⚠️ Legacy PHP POS sync runner is disabled. Set ENABLE_LEGACY_POS_SYNC=true to re-enable it.");
  process.exit(0);
}

// Ensure process env for execution
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.warn("⚠️ Legacy PHP POS sync runner is enabled. This path is intentionally retained only for explicit opt-in recovery.");
  console.log("⚡ Starting Live PHP POS Catalog Sync CLI runner...");
  throw new Error("Legacy PHP POS sync runner disabled: import path no longer exists. Re-enable only after restoring a supported sync service.");
}

run()
  .catch(err => console.error("❌ Sync Runner crashed:", err))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
