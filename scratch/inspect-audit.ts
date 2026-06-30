import { prisma } from "../src/services/prisma.service";

async function main() {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityId: "f4ed52cb-58c6-4dd0-81d2-78744861f553"
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });

  console.log("=== AUDIT LOGS ===");
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error);
