import "server-only";
import { and, asc, eq, gt, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { bloqueios, reservas, reservasFixas } from "@/db/schema";
import { instanteSP, somarDias, type DataISO } from "@/lib/datas";
import { datasDoFixo } from "./recorrencia";
import { sobrepoe } from "./slots";

type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ResultadoGeracao = { criadas: { id: string; data: DataISO }[]; puladas: DataISO[] };

/**
 * Cria as reservas semanais de um horário fixo até a data `ate`.
 * Datas bloqueadas ou já ocupadas por outra reserva ficam de fora (a exclusion
 * constraint decide quem chegou primeiro; aqui só não insiste).
 */
export async function gerarReservasDoFixo(
  tx: Transacao,
  fixa: typeof reservasFixas.$inferSelect,
  ate: DataISO,
): Promise<ResultadoGeracao> {
  const datas = datasDoFixo({ ...fixa, ate });
  const resultado: ResultadoGeracao = { criadas: [], puladas: [] };

  if (datas.length) {
    const horario = fixa.horario.slice(0, 5);
    const jogos = datas.map((data) => {
      const inicio = instanteSP(data, horario);
      return { data, inicio, fim: new Date(inicio.getTime() + fixa.duracao * 60_000) };
    });

    const bloqueiosNoPeriodo = await tx
      .select({ inicio: bloqueios.inicio, fim: bloqueios.fim })
      .from(bloqueios)
      .where(
        and(
          eq(bloqueios.quadraId, fixa.quadraId),
          lt(bloqueios.inicio, jogos.at(-1)!.fim),
          gt(bloqueios.fim, jogos[0].inicio),
        ),
      );

    for (const jogo of jogos) {
      if (bloqueiosNoPeriodo.some((b) => sobrepoe(b, jogo))) {
        resultado.puladas.push(jogo.data);
        continue;
      }
      // ON CONFLICT DO NOTHING também vale para a exclusion constraint de sobreposição.
      const [criada] = await tx
        .insert(reservas)
        .values({
          quadraId: fixa.quadraId,
          clienteId: fixa.clienteId,
          inicio: jogo.inicio,
          fim: jogo.fim,
          observacoes: fixa.observacoes,
          criadoPor: fixa.criadoPor,
          fixaId: fixa.id,
        })
        .onConflictDoNothing()
        .returning({ id: reservas.id });
      if (criada) resultado.criadas.push({ id: criada.id, data: jogo.data });
      else resultado.puladas.push(jogo.data);
    }
  }

  await tx.update(reservasFixas).set({ geradaAte: ate }).where(eq(reservasFixas.id, fixa.id));
  return resultado;
}

/**
 * Garante que todos os horários fixos têm reservas criadas até `ate`.
 * Chamado antes de ler a agenda: assim qualquer data que alguém abrir já mostra os fixos.
 */
export async function garantirReservasFixas(quadraId: string, ate: DataISO) {
  const pendentes = await db
    .select()
    .from(reservasFixas)
    .where(
      and(
        eq(reservasFixas.quadraId, quadraId),
        lt(reservasFixas.geradaAte, ate),
        or(isNull(reservasFixas.fimVigencia), gt(reservasFixas.fimVigencia, reservasFixas.geradaAte)),
      ),
    );
  for (const fixa of pendentes) {
    await db.transaction((tx) => gerarReservasDoFixo(tx, fixa, ate));
  }
}

/** Horários fixos ainda valendo de um cliente. */
export async function getFixasDoCliente(clienteId: string, hoje: DataISO) {
  return db
    .select({ id: reservasFixas.id, diaSemana: reservasFixas.diaSemana, horario: reservasFixas.horario })
    .from(reservasFixas)
    .where(
      and(
        eq(reservasFixas.clienteId, clienteId),
        or(isNull(reservasFixas.fimVigencia), gt(reservasFixas.fimVigencia, somarDias(hoje, -1))),
      ),
    )
    .orderBy(asc(reservasFixas.diaSemana), asc(reservasFixas.horario));
}
