// Prisma 7 config — uses DIRECT_URL for migrations, DATABASE_URL for runtime
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses connection pooler)
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
