import { defineConfig } from "@prisma/config";

const dbUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:xnZWfOK7CV5LM5Ec@db.ljvzxffymgjpvvrbmoag.supabase.co:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});
