import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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
  const admin = await prisma.user.upsert({
    where: { email: "admin@nextgenfashion.com" },
    update: {},
    create: {
      email: "admin@nextgenfashion.com",
      name: "System Admin",
      password: "$2b$12$OcWmGIT0gYOleJ23RSA1D.U9XnFDXB.85Zh.BmlaHmJ4e7QRQWxzO", // admin123
      role: UserRole.SUPERADMIN,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 2. Create Categories
  const categoryData = [
    { name: "Tops", description: "Shirts, tees, and blouses" },
    { name: "Bottoms", description: "Pants, shorts, and skirts" },
    { name: "Dresses", description: "Elegant and casual dresses" },
    { name: "Footwear", description: "Shoes, boots, and sandals" },
    { name: "Accessories", description: "Hats, belts, and more" },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
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
