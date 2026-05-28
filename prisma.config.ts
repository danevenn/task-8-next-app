import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 6 ya no autocarga el .env cuando existe prisma.config.ts.
// Cargamos .env.local (convención de Next.js) para que el CLI de Prisma
// tenga DATABASE_URL y DIRECT_URL en migraciones y seed.
loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
