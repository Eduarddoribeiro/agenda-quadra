import "server-only";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { bloqueios, horariosFuncionamento } from "@/db/schema";
import { getQuadraPrincipal } from "@/modules/agenda/consultas";

export type HorarioDia = { diaSemana: number; aberto: boolean; abertura: string; fechamento: string };

/** Os 7 dias da semana (0 = domingo), incluindo os fechados. Horas no formato HH:mm. */
export async function getHorarios(): Promise<HorarioDia[]> {
  const quadra = await getQuadraPrincipal();
  const linhas = await db.query.horariosFuncionamento.findMany({
    where: eq(horariosFuncionamento.quadraId, quadra.id),
  });
  return [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => {
    const linha = linhas.find((l) => l.diaSemana === diaSemana);
    return linha
      ? { diaSemana, aberto: true, abertura: linha.abertura.slice(0, 5), fechamento: linha.fechamento.slice(0, 5) }
      : { diaSemana, aberto: false, abertura: "08:00", fechamento: "23:00" };
  });
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
