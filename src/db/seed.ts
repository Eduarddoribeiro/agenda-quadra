import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

config({ path: ".env.local" });

// Seed idempotente: cria a quadra e o horário de funcionamento só se ainda não existirem.
// Rodar com: npm run db:seed
async function main() {
  const url = process.env.DATABASE_URL_DIRETA ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Defina DATABASE_URL no .env.local");

  const conexao = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(conexao, { schema });

  try {
    const existente = await db.query.quadras.findFirst();
    if (existente) {
      console.log(`Quadra já existe (${existente.nome}). Nada a fazer.`);
      return;
    }

    const [quadra] = await db
      .insert(schema.quadras)
      .values({ nome: "Quadra principal" })
      .returning();

    // Todos os dias, das 08:00 às 23:00 (último jogo às 22h). Ajustável na tela Ajustes.
    await db.insert(schema.horariosFuncionamento).values(
      [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
        quadraId: quadra.id,
        diaSemana,
        abertura: "08:00",
        fechamento: "23:00",
      })),
    );

    console.log(`Criada "${quadra.nome}" com funcionamento 08:00–23:00 todos os dias.`);
  } finally {
    await conexao.end();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
