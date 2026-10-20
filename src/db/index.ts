import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalParaDb = globalThis as unknown as { conexao?: postgres.Sql };

const url = process.env.DATABASE_URL!;
// Banco local PGlite (npm run db:local) só aguenta uma conexão por vez.
const bancoLocal = /@(127\.0\.0\.1|localhost):5433\//.test(url);

// O pooler do Supabase em modo transaction (porta 6543) não suporta prepared statements.
const conexao =
  globalParaDb.conexao ?? postgres(url, { prepare: false, max: bancoLocal ? 1 : 5 });

if (process.env.NODE_ENV !== "production") globalParaDb.conexao = conexao;

export const db = drizzle(conexao, { schema });
export type Db = typeof db;
