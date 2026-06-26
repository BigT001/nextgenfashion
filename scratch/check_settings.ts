import { prisma } from "../src/services/prisma.service";

async function check() {
  console.log("Reading settings...");
  const settings = await prisma.settings.findMany();
  console.log("Current Settings in DB:");
  console.log(JSON.stringify(settings, null, 2));
}

check().catch(console.error);
