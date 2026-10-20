import { instanteSP, minutosDoHorario, somarDias, type DataISO } from "@/lib/datas";

// Lógica pura (sem banco) dos slots de 1 hora. Os horários livres são calculados:
// slots dentro do funcionamento, menos reservas confirmadas e bloqueios.

export type Intervalo = { inicio: Date; fim: Date };

export type ReservaNoSlot = Intervalo & {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string | null;
  observacoes: string | null;
};

export type BloqueioNoSlot = Intervalo & { id: string; motivo: string };

export type Funcionamento = { abertura: string; fechamento: string } | null;

export type EstadoSlot = "livre" | "reservado" | "bloqueado";

export type Slot = {
  /** Hora de início no fuso da quadra (pode passar de 23 se fecha depois da meia-noite). */
  hora: number;
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

/** Instante de uma hora cheia do dia, aceitando horas ≥ 24 (dia seguinte). */
function instanteDaHora(data: DataISO, hora: number): Date {
  const dia = somarDias(data, Math.floor(hora / 24));
  return instanteSP(dia, `${String(hora % 24).padStart(2, "0")}:00`);
}

export function calcularSlots(params: {
  data: DataISO;
  funcionamento: Funcionamento;
  reservas: ReservaNoSlot[];
  bloqueios: BloqueioNoSlot[];
  agora?: Date;
}): Slot[] {
  const { data, funcionamento, reservas, bloqueios, agora = new Date() } = params;
  if (!funcionamento) return [];

  // Só slots inteiros: abertura arredonda para cima, fechamento para baixo.
  const primeiraHora = Math.ceil(minutosDoHorario(funcionamento.abertura) / 60);
  const ultimaHora = Math.floor(minutosDoHorario(funcionamento.fechamento) / 60);

  const slots: Slot[] = [];
  for (let hora = primeiraHora; hora < ultimaHora; hora++) {
    const inicio = instanteDaHora(data, hora);
    const fim = instanteDaHora(data, hora + 1);
    const intervalo = { inicio, fim };

    const reserva = reservas.find((r) => sobrepoe(r, intervalo));
    const bloqueio = reserva ? undefined : bloqueios.find((b) => sobrepoe(b, intervalo));

    slots.push({
      hora,
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
