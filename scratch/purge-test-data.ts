import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function purge() {
  console.log("🧹 Starting Complete Database Test Data Purge...");

  // 1. Delete Sale Items
  console.log("   👉 Deleting all SaleItem records...");
  const deletedSaleItems = await prisma.saleItem.deleteMany({});
  console.log(`   ✅ Deleted ${deletedSaleItems.count} SaleItem records.`);

  // 2. Delete Sales
  console.log("   👉 Deleting all Sale records...");
  const deletedSales = await prisma.sale.deleteMany({});
  console.log(`   ✅ Deleted ${deletedSales.count} Sale records.`);

  // 3. Delete Inventories
  console.log("   👉 Deleting all Inventory records...");
  const deletedInventory = await prisma.inventory.deleteMany({});
  console.log(`   ✅ Deleted ${deletedInventory.count} Inventory records.`);

  // 4. Delete Product Variants
  console.log("   👉 Deleting all ProductVariant records...");
  const deletedVariants = await prisma.productVariant.deleteMany({});
  console.log(`   ✅ Deleted ${deletedVariants.count} ProductVariant records.`);

  // 5. Delete Products
  console.log("   👉 Deleting all Product records...");
  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`   ✅ Deleted ${deletedProducts.count} Product records.`);

  // 6. Delete Categories
  console.log("   👉 Deleting all Category records...");
  const deletedCategories = await prisma.category.deleteMany({});
  console.log(`   ✅ Deleted ${deletedCategories.count} Category records.`);

  // 7. Delete Audit Logs
  console.log("   👉 Deleting all AuditLog records...");
  const deletedLogs = await prisma.auditLog.deleteMany({});
  console.log(`   ✅ Deleted ${deletedLogs.count} AuditLog records.`);

  // 8. Delete Customers
  console.log("   👉 Deleting all Customer records...");
  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`   ✅ Deleted ${deletedCustomers.count} Customer records.`);

  // 9. Delete Users except SUPERADMIN
  console.log("   👉 Deleting all User records (Except SUPERADMIN)...");
  
  // Find superadmins to verify
  const superadmins = await prisma.user.findMany({
    where: { role: "SUPERADMIN" }
  });
  console.log(`   🛡️ Super Admins found to keep: ${superadmins.map(s => s.email).join(", ")}`);

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: {
        not: "SUPERADMIN"
      }
    }
  });
  console.log(`   ✅ Deleted ${deletedUsers.count} test User records.`);

  console.log("\n🎉 Complete Database Purge finished successfully! The database is fresh, clean, and ready for live imports!");
}

purge()
  .catch(err => console.error("❌ Purge Failed:", err))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
