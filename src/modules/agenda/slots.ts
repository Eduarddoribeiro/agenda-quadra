import { instanteSP, minutosDoHorario, somarDias, type DataISO } from "@/lib/datas";

// Lógica pura (sem banco) dos slots de 1 hora. Os horários livres são calculados:
// slots dentro do funcionamento, menos reservas confirmadas e bloqueios.
// Um dia pode ter vários períodos (ex.: quarta 08:00–18:00 e 18:30–22:30),
// e cada período gera slots de 1h a partir da sua abertura.

export type Intervalo = { inicio: Date; fim: Date };

export type ReservaNoSlot = Intervalo & {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string | null;
  observacoes: string | null;
  /** Veio de um horário fixo (toda semana) */
  fixaId: string | null;
};

export type BloqueioNoSlot = Intervalo & { id: string; motivo: string };

export type Periodo = { abertura: string; fechamento: string };

export const DURACAO_SLOT = 60;

export type EstadoSlot = "livre" | "reservado" | "bloqueado";

export type Slot = {
  /** Início em minutos desde 00:00 do dia, no fuso da quadra (ex.: 1110 = 18h30). */
  minuto: number;
  inicio: Date;
  fim: Date;
  estado: EstadoSlot;
  /** O slot já terminou. */
  passado: boolean;
  /** O slot está acontecendo agora. */
  agora: boolean;
  reserva?: ReservaNoSlot;
  bloqueio?: BloqueioNoSlot;
};

export function sobrepoe(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

/** Instante de um minuto do dia, aceitando valores ≥ 24h (dia seguinte). */
export function instanteDoMinuto(data: DataISO, minuto: number): Date {
  const dia = somarDias(data, Math.floor(minuto / 1440));
  const m = minuto % 1440;
  return instanteSP(dia, `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}

/** Minutos de início de cada slot: de 1 em 1 hora a partir da abertura de cada período. */
export function iniciosDosSlots(periodos: Periodo[]): number[] {
  const inicios: number[] = [];
  for (const p of [...periodos].sort((a, b) => minutosDoHorario(a.abertura) - minutosDoHorario(b.abertura))) {
    const fechamento = minutosDoHorario(p.fechamento);
    for (let m = minutosDoHorario(p.abertura); m + DURACAO_SLOT <= fechamento; m += DURACAO_SLOT) {
      // Períodos sobrepostos (não deveriam existir) não geram slot duplicado.
      if (inicios.length && m < inicios.at(-1)! + DURACAO_SLOT) continue;
      inicios.push(m);
    }
  }
  return inicios;
}

export function calcularSlots(params: {
  data: DataISO;
  /** Vazio = fechado no dia */
  periodos: Periodo[];
  reservas: ReservaNoSlot[];
  bloqueios: BloqueioNoSlot[];
  agora?: Date;
}): Slot[] {
  const { data, periodos, reservas, bloqueios, agora = new Date() } = params;

  const slots: Slot[] = [];
  for (const minuto of iniciosDosSlots(periodos)) {
    const inicio = instanteDoMinuto(data, minuto);
    const fim = instanteDoMinuto(data, minuto + DURACAO_SLOT);
    const intervalo = { inicio, fim };

    const reserva = reservas.find((r) => sobrepoe(r, intervalo));
    const bloqueio = reserva ? undefined : bloqueios.find((b) => sobrepoe(b, intervalo));

    slots.push({
      minuto,
      inicio,
      fim,
      estado: reserva ? "reservado" : bloqueio ? "bloqueado" : "livre",
      passado: fim <= agora,
      agora: inicio <= agora && agora < fim,
      reserva,
      bloqueio,
    });
  }
  return slots;
}

export function slotsLivresFuturos(slots: Slot[]): Slot[] {
  return slots.filter((s) => s.estado === "livre" && !s.passado);
}

/**
 * Linhas da tela do dia: um jogo mais longo que 1h ou fora da grade (ex.: vôlei das
 * 14h30 às 16h) ocupa vários slots, mas aparece uma vez só.
 */
export function linhasDoDia(slots: Slot[]): Slot[] {
  return slots.filter((s, i) => !s.reserva || slots[i - 1]?.reserva?.id !== s.reserva.id);
}

/** Horários que já passaram sem jogo, em sequência: viram uma linha curta na tela do dia. */
export type PassadosLivres = { tipo: "passados"; de: number; ate: number; quantos: number };

/** Junta os livres que já passaram, para os horários que ainda servem aparecerem logo. */
export function juntarPassadosLivres(linhas: Slot[]): (Slot | PassadosLivres)[] {
  const saida: (Slot | PassadosLivres)[] = [];
  for (const s of linhas) {
    const anterior = saida.at(-1);
    if (s.estado !== "livre" || !s.passado) saida.push(s);
    else if (anterior && "tipo" in anterior && anterior.ate === s.minuto) {
      anterior.ate = s.minuto + 60;
      anterior.quantos++;
    } else saida.push({ tipo: "passados", de: s.minuto, ate: s.minuto + 60, quantos: 1 });
  }
  return saida;
}

/** Primeiro slot ocupado (reserva ou bloqueio) que choca com o intervalo. */
export function conflitoNoIntervalo(slots: Slot[], intervalo: Intervalo): Slot | undefined {
  return slots.find((s) => s.estado !== "livre" && sobrepoe(s.reserva ?? s.bloqueio ?? s, intervalo));
}

/** O que já passou no dia, para virar uma linha só no topo da tela de hoje. */
export type ResumoPassados = {
  /** Linhas que já terminaram, em ordem (as linhas de um dia vêm sempre em ordem). */
  linhas: Slot[];
  /** Minuto de início da primeira e de fim da última. */
  de: number;
  ate: number;
  jogos: number;
  livres: number;
};

/** Separa as linhas que já terminaram das que ainda servem (a que está acontecendo fica no resto). */
export function separarPassados(linhas: Slot[]): { passados: ResumoPassados | null; resto: Slot[] } {
  const corte = linhas.findIndex((s) => !s.passado);
  const fim = corte === -1 ? linhas.length : corte;
  const passadas = linhas.slice(0, fim);
  if (!passadas.length) return { passados: null, resto: linhas };
  const ultima = passadas.at(-1)!;
  return {
    passados: {
      linhas: passadas,
      de: passadas[0].minuto,
      ate: ultima.reserva ? minutoDoDia(ultima, ultima.reserva.fim) : ultima.minuto + DURACAO_SLOT,
      jogos: passadas.filter((s) => s.estado === "reservado").length,
      livres: passadas.filter((s) => s.estado === "livre").length,
    },
    resto: linhas.slice(fim),
  };
}

/** Minuto do dia de um instante, tomando o slot como referência (aceita passar da meia-noite). */
function minutoDoDia(slot: Slot, instante: Date): number {
  return slot.minuto + Math.round((instante.getTime() - slot.inicio.getTime()) / 60000);
}
