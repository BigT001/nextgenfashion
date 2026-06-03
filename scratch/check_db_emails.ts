import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

async function test() {
  const emails = await prisma.emailMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("Recent emails in DB:", JSON.stringify(emails, null, 2));
}

test();
