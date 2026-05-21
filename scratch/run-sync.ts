import { SyncPosProductsService } from "../src/modules/products/services/sync-pos-products.service";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Ensure process env for execution
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("⚡ Starting Live PHP POS Catalog Sync CLI runner...");
  const start = Date.now();
  
  const result = await SyncPosProductsService.execute();
  
  console.log("\n==========================================");
  console.log("🎉 Live POS Synchronization Finished!");
  console.log(`   🔹 Total Synced Items: ${result.totalSynced}`);
  console.log(`   🔹 Created (New): ${result.totalCreated}`);
  console.log(`   🔹 Updated (Sync): ${result.totalUpdated}`);
  console.log(`   🔹 Execution Time: ${Math.round((Date.now() - start) / 1000)} seconds`);
  console.log(`   🔹 Successful Run: ${result.success}`);
  console.log("==========================================");
  
  if (result.errors.length > 0) {
    console.warn(`⚠️ Encountered ${result.errors.length} item errors during sync:`);
    console.log(result.errors.slice(0, 10));
  }
}

run()
  .catch(err => console.error("❌ Sync Runner crashed:", err))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
