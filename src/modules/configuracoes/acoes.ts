"use server";

import { and, eq, gt, lt } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { bloqueios, horariosFuncionamento, reservas } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { DIAS_SEMANA, ehDataISO, instanteSP, minutosDoHorario, somarDias, type DataISO } from "@/lib/datas";
import { falha, sucesso, type Resultado } from "@/lib/resultado";
import { getQuadraPrincipal } from "@/modules/agenda/consultas";
import { DURACAO_SLOT } from "@/modules/agenda/slots";
import type { HorarioDia } from "./consultas";

const REGEX_HORA = /^([01]\d|2[0-4]):[0-5]\d$/;

export async function salvarHorarios(dias: HorarioDia[]): Promise<Resultado> {
  await exigirUsuario();

  for (const d of dias) {
    if (!Number.isInteger(d.diaSemana) || d.diaSemana < 0 || d.diaSemana > 6) return falha("Dia inválido.");
    const nome = DIAS_SEMANA[d.diaSemana];
    const ordenados = [...d.periodos].sort((a, b) => a.abertura.localeCompare(b.abertura));
    for (const [i, p] of ordenados.entries()) {
      if (!REGEX_HORA.test(p.abertura) || !REGEX_HORA.test(p.fechamento)) return falha("Horário inválido.");
      if (minutosDoHorario(p.fechamento) - minutosDoHorario(p.abertura) < DURACAO_SLOT)
        return falha(`${nome}: cada período precisa ter pelo menos 1 hora.`);
      if (i > 0 && p.abertura < ordenados[i - 1].fechamento)
        return falha(`${nome}: os períodos não podem se sobrepor.`);
    }
  }

  const quadra = await getQuadraPrincipal();
  // Substitui tudo: são no máximo algumas linhas por dia.
  await db.transaction(async (tx) => {
    await tx.delete(horariosFuncionamento).where(eq(horariosFuncionamento.quadraId, quadra.id));
    const linhas = dias.flatMap((d) =>
      d.periodos.map((p) => ({ quadraId: quadra.id, diaSemana: d.diaSemana, abertura: p.abertura, fechamento: p.fechamento })),
    );
    if (linhas.length) await tx.insert(horariosFuncionamento).values(linhas);
  });

  refresh();
  return sucesso();
}

export type NovoBloqueio = {
  data: DataISO;
  /** Ausentes = dia inteiro */
  horaInicio?: string;
  horaFim?: string;
  motivo: string;
};

export async function criarBloqueio(entrada: NovoBloqueio): Promise<Resultado> {
  await exigirUsuario();
  const motivo = entrada.motivo.trim();
  if (!ehDataISO(entrada.data)) return falha("Escolha a data.");
  if (!motivo) return falha("Informe o motivo.");

  const diaInteiro = !entrada.horaInicio || !entrada.horaFim;
  if (!diaInteiro && (!REGEX_HORA.test(entrada.horaInicio!) || !REGEX_HORA.test(entrada.horaFim!)))
    return falha("Horário inválido.");
  if (!diaInteiro && entrada.horaFim! <= entrada.horaInicio!) return falha("O fim precisa ser depois do início.");

  const inicio = instanteSP(entrada.data, diaInteiro ? "00:00" : entrada.horaInicio!);
  const fim =
    diaInteiro || entrada.horaFim === "24:00"
      ? instanteSP(somarDias(entrada.data, 1), "00:00")
      : instanteSP(entrada.data, entrada.horaFim!);

  const quadra = await getQuadraPrincipal();

  // Não bloqueia por cima de jogo marcado: o dono decide antes o que fazer com a reserva.
  const conflitos = await db
    .select({ id: reservas.id })
    .from(reservas)
    .where(
      and(
        eq(reservas.quadraId, quadra.id),
        eq(reservas.status, "confirmada"),
        lt(reservas.inicio, fim),
        gt(reservas.fim, inicio),
      ),
    );
  if (conflitos.length) {
    const qtd = conflitos.length;
    return falha(
      `Há ${qtd} ${qtd === 1 ? "reserva" : "reservas"} nesse período. Cancele ou mude ${qtd === 1 ? "ela" : "elas"} antes de bloquear.`,
    );
  }

  await db.insert(bloqueios).values({ quadraId: quadra.id, inicio, fim, motivo });
  refresh();
  return sucesso();
}

export async function removerBloqueio(id: string): Promise<Resultado> {
  await exigirUsuario();
  await db.delete(bloqueios).where(eq(bloqueios.id, id));
  refresh();
  return sucesso();
}
