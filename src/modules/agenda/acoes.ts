"use server";

import { and, eq, gte } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { reservas, reservasFixas } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { dataSP, diaDaSemana, ehDataISO, formatarSP, minutosDoHorario, somarDias, type DataISO } from "@/lib/datas";
import { codigoPg, falha, sucesso, type Resultado } from "@/lib/resultado";
import { normalizarTelefone, telefoneValido } from "@/lib/telefone";
import { getAgendaDia, getQuadraPrincipal } from "./consultas";
import { gerarReservasDoFixo } from "./fixas";
import { clienteExistenteOuNovo } from "@/modules/clientes/repetidos";
import { SEMANAS_INICIAIS } from "./recorrencia";
import { conflitoNoIntervalo, instanteDoMinuto, type Intervalo } from "./slots";

export type NovaReserva = {
  data: DataISO;
  /** Minutos desde 00:00 do dia (ex.: 1110 = 18h30) */
  minuto: number;
  /**
   * Fim em minutos, quando não é o jogo de 1h do slot (ex.: vôlei das 14h30 às 16h:
   * minuto 870, fim 960). Precisa caber num período de funcionamento.
   */
  fim?: number;
  clienteId?: string;
  novoCliente?: { nome: string; telefone: string };
  observacoes?: string;
  /** Marca o mesmo dia da semana e horário toda semana, a partir desta data */
  repetirSemanal?: boolean;
};

const MSG_OCUPADO = "Esse horário acabou de ser ocupado. Escolha outro.";

export async function criarReserva(
  entrada: NovaReserva,
): Promise<Resultado<{ reservaId: string; semanas: number; puladas: DataISO[] }>> {
  const usuario = await exigirUsuario();

  if (!ehDataISO(entrada.data) || !Number.isInteger(entrada.minuto)) return falha("Horário inválido.");

  // Confere no servidor que o horário existe e está livre (funcionamento, bloqueios e reservas).
  const dia = await getAgendaDia(entrada.data);
  let horario: Intervalo;
  if (entrada.fim === undefined) {
    const slot = dia.slots.find((s) => s.minuto === entrada.minuto);
    if (!slot) return falha("A quadra não funciona nesse horário.");
    horario = slot;
  } else {
    const { minuto, fim } = entrada;
    if (!Number.isInteger(fim) || minuto % 30 || fim % 30 || fim <= minuto) return falha("Horário inválido.");
    const cabe = dia.periodos.some((p) => minutosDoHorario(p.abertura) <= minuto && fim <= minutosDoHorario(p.fechamento));
    if (!cabe) return falha("A quadra não funciona em todo esse horário.");
    horario = { inicio: instanteDoMinuto(entrada.data, minuto), fim: instanteDoMinuto(entrada.data, fim) };
  }
  const conflito = conflitoNoIntervalo(dia.slots, horario);
  if (conflito?.estado === "bloqueado") return falha(`Horário bloqueado: ${conflito.bloqueio?.motivo}.`);
  if (conflito) return falha(MSG_OCUPADO);

  let novoCliente: { nome: string; telefone: string | null } | undefined;
  if (!entrada.clienteId) {
    const nome = entrada.novoCliente?.nome.trim() ?? "";
    const telefone = entrada.novoCliente?.telefone.trim() ?? "";
    if (nome.length < 2) return falha("Informe o nome do cliente.");
    if (telefone && !telefoneValido(telefone)) return falha("Telefone inválido. Use DDD + número.");
    novoCliente = { nome, telefone: telefone ? normalizarTelefone(telefone) : null };
  }

  const quadra = await getQuadraPrincipal();

  try {
    const criada = await db.transaction(async (tx) => {
      // Nome que já existe vira o mesmo cliente, para a lista não encher de repetidos.
      let clienteId = entrada.clienteId;
      if (!clienteId && novoCliente) clienteId = (await clienteExistenteOuNovo(tx, novoCliente)).id;
      const observacoes = entrada.observacoes?.trim() || null;

      if (entrada.repetirSemanal) {
        const [fixa] = await tx
          .insert(reservasFixas)
          .values({
            quadraId: quadra.id,
            clienteId: clienteId!,
            diaSemana: diaDaSemana(entrada.data),
            horario: formatarSP(horario.inicio, "HH:mm"),
            duracao: (horario.fim.getTime() - horario.inicio.getTime()) / 60_000,
            inicioVigencia: entrada.data,
            geradaAte: somarDias(entrada.data, -1),
            observacoes,
            criadoPor: usuario.id,
          })
          .returning();
        const ate = somarDias(entrada.data, 7 * (SEMANAS_INICIAIS - 1));
        const { criadas, puladas } = await gerarReservasDoFixo(tx, fixa, ate);
        const primeira = criadas.find((c) => c.data === entrada.data);
        // O primeiro jogo é o que a pessoa tocou: se ele não entrou, alguém pegou o horário agora.
        if (!primeira) throw new HorarioOcupado();
        return { reservaId: primeira.id, semanas: criadas.length, puladas };
      }

      const [reserva] = await tx
        .insert(reservas)
        .values({
          quadraId: quadra.id,
          clienteId: clienteId!,
          inicio: horario.inicio,
          fim: horario.fim,
          observacoes,
          criadoPor: usuario.id,
        })
        .returning({ id: reservas.id });
      return { reservaId: reserva.id, semanas: 1, puladas: [] };
    });

    refresh();
    return sucesso(criada);
  } catch (erro) {
    // 23P01 = exclusion_violation: outra reserva pegou o horário ao mesmo tempo.
    if (erro instanceof HorarioOcupado || codigoPg(erro) === "23P01") return falha(MSG_OCUPADO);
    throw erro;
  }
}

class HorarioOcupado extends Error {}

/**
 * Encerra um horário fixo a partir do jogo informado: cancela esse e os próximos
 * e para de criar novos. Os jogos que já aconteceram ficam no histórico.
 */
export async function encerrarFixa(reservaId: string): Promise<Resultado<{ canceladas: number }>> {
  await exigirUsuario();
  const reserva = await db.query.reservas.findFirst({ where: eq(reservas.id, reservaId) });
  if (!reserva?.fixaId) return falha("Essa reserva não é de um horário fixo.");

  const desde = reserva.inicio;
  const canceladas = await db.transaction(async (tx) => {
    await tx
      .update(reservasFixas)
      .set({ fimVigencia: somarDias(dataSP(desde), -1) })
      .where(eq(reservasFixas.id, reserva.fixaId!));
    const linhas = await tx
      .update(reservas)
      .set({ status: "cancelada" })
      .where(
        and(eq(reservas.fixaId, reserva.fixaId!), eq(reservas.status, "confirmada"), gte(reservas.inicio, desde)),
      )
      .returning({ id: reservas.id });
    return linhas.length;
  });

  refresh();
  return sucesso({ canceladas });
}

export async function cancelarReserva(reservaId: string): Promise<Resultado> {
  await exigirUsuario();
  await db
    .update(reservas)
    .set({ status: "cancelada" })
    .where(and(eq(reservas.id, reservaId), eq(reservas.status, "confirmada")));
  refresh();
  return sucesso();
}

/** Desfaz um cancelamento (botão "Desfazer" do aviso). */
export async function reativarReserva(reservaId: string): Promise<Resultado> {
  await exigirUsuario();
  try {
    await db.update(reservas).set({ status: "confirmada" }).where(eq(reservas.id, reservaId));
  } catch (erro) {
    if (codigoPg(erro) === "23P01") return falha("O horário já foi reservado para outra pessoa.");
    throw erro;
  }
  refresh();
  return sucesso();
}

export async function editarReserva(
  reservaId: string,
  dados: { clienteId?: string; observacoes?: string },
): Promise<Resultado> {
  await exigirUsuario();
  await db
    .update(reservas)
    .set({
      ...(dados.clienteId ? { clienteId: dados.clienteId } : {}),
      ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes.trim() || null } : {}),
    })
    .where(eq(reservas.id, reservaId));
  refresh();
  return sucesso();
}

/** Move a reserva para outro horário livre (mesmo cliente). */
export async function moverReserva(reservaId: string, data: DataISO, minuto: number): Promise<Resultado> {
  await exigirUsuario();
  if (!ehDataISO(data)) return falha("Data inválida.");

  const dia = await getAgendaDia(data);
  const slot = dia.slots.find((s) => s.minuto === minuto);
  if (!slot) return falha("A quadra não funciona nesse horário.");

  // Mantém a duração do jogo (um de 1h30 continua 1h30 no horário novo).
  const atual = await db.query.reservas.findFirst({ where: eq(reservas.id, reservaId) });
  if (!atual) return falha("Reserva não encontrada.");
  const fim = new Date(slot.inicio.getTime() + (atual.fim.getTime() - atual.inicio.getTime()));
  const outros = dia.slots.filter((s) => s.reserva?.id !== reservaId);
  const conflito = conflitoNoIntervalo(outros, { inicio: slot.inicio, fim });
  if (conflito?.estado === "bloqueado") return falha(`Horário bloqueado: ${conflito.bloqueio?.motivo}.`);
  if (conflito) return falha(MSG_OCUPADO);

  try {
    await db.update(reservas).set({ inicio: slot.inicio, fim }).where(eq(reservas.id, reservaId));
  } catch (erro) {
    if (codigoPg(erro) === "23P01") return falha(MSG_OCUPADO);
    throw erro;
  }
  refresh();
  return sucesso();
}
