require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();

  const email = "admin@nextgenfashion.com";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "SUPERADMIN"
    },
    create: {
      email,
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPERADMIN"
    }
  });

  console.log("SuperAdmin updated:", user.email, user.role);
  await prisma.$disconnect();
}

main().catch(console.error);
