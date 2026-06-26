import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/services/prisma.service";

async function checkSettings() {
  const settings = await prisma.settings.findMany();
  console.log("Database Settings:");
  console.log(JSON.stringify(settings, null, 2));
}

checkSettings();
