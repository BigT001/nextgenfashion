import { prisma } from "../src/services/prisma.service";

async function main() {
  console.log("Checking Prisma Client state...");
  // The prisma service already logs on initialization
  await prisma.$connect();
  console.log("Prisma connected.");
}

main().catch(console.error).finally(() => process.exit());
