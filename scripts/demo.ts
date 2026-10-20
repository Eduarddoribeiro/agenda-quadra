// Prepara e reseta o banco da DEMONSTRAÇÃO (Postgres separado, ex.: Neon, configurado em .env.demo).
//   npm run demo:preparar  → migrations + dados de exemplo
//   npm run demo:resetar   → só volta os dados ao exemplo
// Recusa rodar contra o Supabase (o banco do Krahe).
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { WHATSAPP_CONTATO } from "../src/lib/demo";
import { resetarDemo } from "../src/modules/demo/dados";

config({ path: ".env.demo", quiet: true });

const comando = process.argv[2];
const url = process.env.DATABASE_URL_DIRETA ?? process.env.DATABASE_URL ?? "";

function parar(mensagem: string): never {
  console.error(mensagem);
  process.exit(1);
}

if (!["preparar", "resetar"].includes(comando)) parar("Use: npm run demo:preparar ou npm run demo:resetar");
if (process.env.NEXT_PUBLIC_MODO_DEMO !== "1") parar(".env.demo precisa ter NEXT_PUBLIC_MODO_DEMO=1.");
if (!url) parar("Defina DATABASE_URL no .env.demo.");
if (/supabase\.(com|co)/.test(url)) parar("O .env.demo aponta para o Supabase (banco do Krahe). Nada foi feito.");

async function main() {
  const conexao = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const db = drizzle(conexao, { schema });
  try {
    if (comando === "preparar") {
      // A tabela usuarios aponta para auth.users, que só existe no Supabase. Fora dele,
      // um esqueleto basta (a demo não tem login).
      await conexao`create schema if not exists auth`;
      await conexao`create table if not exists auth.users (id uuid primary key, email text)`;
      await migrate(db, { migrationsFolder: "src/db/migrations" });
      console.log("Migrations aplicadas.");
    }
    await resetarDemo(db, process.env.NEXT_PUBLIC_DEMO_WHATSAPP ?? WHATSAPP_CONTATO);
    console.log("Dados de exemplo recriados.");
  } finally {
    await conexao.end();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
