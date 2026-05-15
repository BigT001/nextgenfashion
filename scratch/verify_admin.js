const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@nextgenfashion.com" }
  });
  console.log(JSON.stringify({
    email: admin?.email,
    role: admin?.role,
    hasPassword: !!admin?.password,
    passwordPreview: admin?.password ? admin.password.substring(0, 10) + "..." : null
  }, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
