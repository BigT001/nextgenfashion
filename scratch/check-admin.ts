import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkAdmin() {
  const pool = new Pool({ 
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@nextgenfashion.com" }
    });

    if (user) {
      console.log("✅ Admin user found in database.");
      console.log("📧 Email:", user.email);
      console.log("🏷️ Role:", user.role);
      
      const testPass = "admin123";
      const isValid = await bcrypt.compare(testPass, user.password || "");
      console.log(`🔐 Password 'admin123' is valid: ${isValid}`);
      
      if (!isValid) {
        const newHash = await bcrypt.hash(testPass, 12);
        console.log("🆕 New hash generated for 'admin123':", newHash);
      }
    } else {
      console.log("❌ Admin user NOT found in database.");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkAdmin();
