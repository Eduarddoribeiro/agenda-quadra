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
function instanteDoMinuto(data: DataISO, minuto: number): Date {
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
