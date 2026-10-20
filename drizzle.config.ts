import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  // Migrations usam a conexão direta/session (porta 5432); o app usa o pooler.
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRETA ?? process.env.DATABASE_URL!,
  },
  // O schema "auth" é do Supabase; não gerenciamos.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
