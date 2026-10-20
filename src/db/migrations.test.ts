import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Aplica as migrations reais num Postgres em memória e verifica as regras do banco.
let pg: PGlite;
let quadraId: string;
let clienteId: string;

async function reservar(inicio: string, fim: string, status = "confirmada") {
  await pg.query(
    `insert into reservas (quadra_id, cliente_id, inicio, fim, status) values ($1, $2, $3, $4, $5)`,
    [quadraId, clienteId, inicio, fim, status],
  );
}

async function erroDe(promessa: Promise<unknown>) {
  try {
    await promessa;
    return null;
  } catch (e) {
    return (e as { constraint?: string; message: string }).constraint ?? (e as Error).message;
  }
}

beforeAll(async () => {
  pg = await PGlite.create({ extensions: { btree_gist } });
  await pg.exec(`create schema auth; create table auth.users (id uuid primary key);`);
  await migrate(drizzle(pg), { migrationsFolder: "src/db/migrations" });

  quadraId = (await pg.query<{ id: string }>(`insert into quadras (nome) values ('Q1') returning id`)).rows[0].id;
  clienteId = (await pg.query<{ id: string }>(`insert into clientes (nome) values ('Ana') returning id`)).rows[0].id;
});

afterAll(async () => {
  await pg.close();
});

beforeEach(async () => {
  await pg.exec(`delete from reservas`);
});

describe("reservas_sem_sobreposicao", () => {
  it("aceita reservas encostadas (19h–20h e 20h–21h)", async () => {
    await reservar("2026-10-20T19:00-03", "2026-10-20T20:00-03");
    expect(await erroDe(reservar("2026-10-20T20:00-03", "2026-10-20T21:00-03"))).toBeNull();
  });

  it("rejeita reserva sobreposta na mesma quadra", async () => {
    await reservar("2026-10-20T19:00-03", "2026-10-20T20:00-03");
    expect(await erroDe(reservar("2026-10-20T19:30-03", "2026-10-20T20:30-03"))).toBe(
      "reservas_sem_sobreposicao",
    );
  });

  it("ignora reservas canceladas", async () => {
    await reservar("2026-10-20T19:00-03", "2026-10-20T20:00-03", "cancelada");
    expect(await erroDe(reservar("2026-10-20T19:00-03", "2026-10-20T20:00-03"))).toBeNull();
  });

  it("permite o mesmo horário em outra quadra", async () => {
    await reservar("2026-10-20T19:00-03", "2026-10-20T20:00-03");
    const outra = (await pg.query<{ id: string }>(`insert into quadras (nome) values ('Q2') returning id`)).rows[0].id;
    const erro = await erroDe(
      pg.query(`insert into reservas (quadra_id, cliente_id, inicio, fim) values ($1, $2, $3, $4)`, [
        outra,
        clienteId,
        "2026-10-20T19:00-03",
        "2026-10-20T20:00-03",
      ]),
    );
    expect(erro).toBeNull();
  });

  it("rejeita fim antes do início", async () => {
    expect(await erroDe(reservar("2026-10-20T21:00-03", "2026-10-20T20:00-03"))).toBe(
      "reservas_fim_depois_inicio",
    );
  });
});

describe("horarios_funcionamento", () => {
  it("aceita fechamento à meia-noite (24:00)", async () => {
    const erro = await erroDe(
      pg.query(
        `insert into horarios_funcionamento (quadra_id, dia_semana, abertura, fechamento) values ($1, 0, '08:00', '24:00')`,
        [quadraId],
      ),
    );
    expect(erro).toBeNull();
  });
});
