// Postgres local em memória/disco (PGlite) para desenvolver sem Supabase.
// Uso: npm run db:local  →  DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
// Só para desenvolvimento. Em produção o banco é o Supabase.
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORTA = Number(process.env.PGLITE_PORTA ?? 5433);

async function main() {
  const db = await PGlite.create({ dataDir: "./.pglite", extensions: { btree_gist } });

  // Simula o schema "auth" do Supabase para a FK de usuarios.id funcionar.
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key, email text);
  `);

  const servidor = new PGLiteSocketServer({ db, port: PORTA, host: "127.0.0.1", maxConnections: 20 });
  await servidor.start();
  console.log(`PGlite ouvindo em postgres://postgres:postgres@127.0.0.1:${PORTA}/postgres`);

  const parar = async () => {
    await servidor.stop();
    await db.close();
    process.exit(0);
  };
  process.on("SIGINT", parar);
  process.on("SIGTERM", parar);
}

main();
