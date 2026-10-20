// Dados fictícios para ver a interface funcionando no banco local (npm run db:exemplo).
// Recusa rodar contra o Supabase para não sujar o banco de verdade.
import { config } from "dotenv";
import postgres from "postgres";
import { hojeSP, instanteSP, somarDias } from "../src/lib/datas";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? "";
if (!/127\.0\.0\.1|localhost/.test(url)) {
  console.error("Este script só roda contra o banco local (DATABASE_URL em 127.0.0.1/localhost).");
  process.exit(1);
}

const CLIENTES = [
  ["Rafael Krause", "5547991234567"],
  ["Pelada da Firma (Juliano)", "5547998887766"],
  ["Diego Schmitt", "5547996543210"],
  ["Tiago Moreira", "5547992223344"],
  ["Escolinha Sub-15", "5547993334455"],
  ["Bruno Hoffmann", null],
] as const;

// [dias a partir de hoje, hora, índice do cliente, observação]
const RESERVAS: [number, number, number, string | null][] = [
  [0, 9, 4, "Treino das crianças"],
  [0, 18, 0, null],
  [0, 19, 1, "Jogam toda semana"],
  [0, 21, 2, null],
  [1, 19, 3, null],
  [1, 20, 1, null],
  [2, 18, 5, null],
  [2, 20, 0, null],
  [2, 21, 2, null],
  [3, 19, 1, null],
  [4, 18, 3, null],
  [4, 19, 0, null],
  [4, 20, 2, null],
  [4, 21, 1, null],
  [5, 10, 4, null],
  [5, 15, 5, "Aniversário"],
];

async function main() {
  const sql = postgres(url, { prepare: false, max: 1 });
  const [quadra] = await sql`select id from quadras order by created_at limit 1`;
  if (!quadra) throw new Error("Rode npm run db:seed antes.");

  await sql`delete from reservas`;
  await sql`delete from bloqueios`;
  await sql`delete from clientes`;

  const ids: string[] = [];
  for (const [nome, telefone] of CLIENTES) {
    const [c] = await sql`insert into clientes (nome, telefone) values (${nome}, ${telefone}) returning id`;
    ids.push(c.id);
  }

  const hoje = hojeSP();
  for (const [dias, hora, cliente, obs] of RESERVAS) {
    const data = somarDias(hoje, dias);
    const inicio = instanteSP(data, `${String(hora).padStart(2, "0")}:00`);
    const fim = instanteSP(data, `${String(hora + 1).padStart(2, "0")}:00`);
    await sql`insert into reservas (quadra_id, cliente_id, inicio, fim, observacoes)
              values (${quadra.id}, ${ids[cliente]}, ${inicio}, ${fim}, ${obs})`;
  }

  const amanha = somarDias(hoje, 1);
  await sql`insert into bloqueios (quadra_id, inicio, fim, motivo)
            values (${quadra.id}, ${instanteSP(amanha, "08:00")}, ${instanteSP(amanha, "12:00")}, 'Manutenção do piso')`;

  console.log(`${CLIENTES.length} clientes, ${RESERVAS.length} reservas e 1 bloqueio criados.`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
