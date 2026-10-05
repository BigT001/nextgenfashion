import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({ 
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@nextgenfashion.com";
  const rawAdminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(rawAdminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
    },
    create: {
      id: "admin-001",
      email: adminEmail,
      name: "System Admin",
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
      permissions: ["ALL"],
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 2. Create Categories
  const categoryData = [
    { id: "cat-001", name: "Tops", description: "Shirts, tees, and blouses" },
    { id: "cat-002", name: "Bottoms", description: "Pants, shorts, and skirts" },
    { id: "cat-003", name: "Dresses", description: "Elegant and casual dresses" },
    { id: "cat-004", name: "Footwear", description: "Shoes, boots, and sandals" },
    { id: "cat-005", name: "Accessories", description: "Hats, belts, and more" },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, updatedAt: new Date() },
    });
  }
  console.log("✅ Categories created.");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
