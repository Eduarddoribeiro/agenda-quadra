import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// Regra do projeto: salvar em UTC, exibir sempre em America/Sao_Paulo.
export const FUSO = "America/Sao_Paulo";

/** Data de calendário no fuso da quadra, no formato yyyy-MM-dd. */
export type DataISO = string;

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

export function ehDataISO(valor: unknown): valor is DataISO {
  return typeof valor === "string" && REGEX_DATA.test(valor) && !Number.isNaN(parseISO(valor).getTime());
}

export function hojeSP(agora: Date = new Date()): DataISO {
  return formatInTimeZone(agora, FUSO, "yyyy-MM-dd");
}

export function somarDias(data: DataISO, dias: number): DataISO {
  return format(addDays(parseISO(data), dias), "yyyy-MM-dd");
}

/** Dia da semana (0 = domingo) de uma data de calendário. */
export function diaDaSemana(data: DataISO): number {
  return parseISO(data).getDay();
}

/** Converte "data + hora de parede em São Paulo" para o instante UTC. */
export function instanteSP(data: DataISO, hora: string): Date {
  return fromZonedTime(`${data}T${hora}`, FUSO);
}

/** Hora (0–23) de um instante, no fuso da quadra. */
export function horaSP(instante: Date): number {
  return Number(formatInTimeZone(instante, FUSO, "H"));
}

export function dataSP(instante: Date): DataISO {
  return formatInTimeZone(instante, FUSO, "yyyy-MM-dd");
}

/** Formata um instante no fuso da quadra (padrões do date-fns, em pt-BR). */
export function formatarSP(instante: Date, padrao: string): string {
  return formatInTimeZone(instante, FUSO, padrao, { locale: ptBR });
}

/** Formata uma data de calendário (sem fuso envolvido). */
export function formatarData(data: DataISO, padrao: string): string {
  return format(parseISO(data), padrao, { locale: ptBR });
}

/** "08:00:00" | "24:00" → minutos desde 00:00 */
export function minutosDoHorario(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function horaCurta(hora: number): string {
  return `${String(hora % 24).padStart(2, "0")}h`;
}

/** Segunda-feira da semana que contém a data. */
export function inicioDaSemana(data: DataISO): DataISO {
  const dia = diaDaSemana(data);
  return somarDias(data, dia === 0 ? -6 : 1 - dia);
}


export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;
export const DIAS_SEMANA_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/** "Terça" — como se fala no dia a dia, sem o "-feira". */
export function nomeDoDia(data: DataISO): string {
  return DIAS_SEMANA[diaDaSemana(data)];
}
