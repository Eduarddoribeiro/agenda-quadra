import "server-only";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { bloqueios, horariosFuncionamento } from "@/db/schema";
import { getQuadraPrincipal } from "@/modules/agenda/consultas";

export type PeriodoHHMM = { abertura: string; fechamento: string };
/** `periodos` vazio = fechado. */
export type HorarioDia = { diaSemana: number; periodos: PeriodoHHMM[] };

/** Os 7 dias da semana (0 = domingo), incluindo os fechados. Horas no formato HH:mm. */
export async function getHorarios(): Promise<HorarioDia[]> {
  const quadra = await getQuadraPrincipal();
  const linhas = await db.query.horariosFuncionamento.findMany({
    where: eq(horariosFuncionamento.quadraId, quadra.id),
    orderBy: asc(horariosFuncionamento.abertura),
  });
  return [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
    diaSemana,
    periodos: linhas
      .filter((l) => l.diaSemana === diaSemana)
      .map((l) => ({ abertura: l.abertura.slice(0, 5), fechamento: l.fechamento.slice(0, 5) })),
  }));
}

/** Bloqueios que ainda não terminaram. */
export async function getBloqueiosFuturos(agora = new Date()) {
  const quadra = await getQuadraPrincipal();
  return db
    .select()
    .from(bloqueios)
    .where(and(eq(bloqueios.quadraId, quadra.id), gt(bloqueios.fim, agora)))
    .orderBy(asc(bloqueios.inicio));
}
