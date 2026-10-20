import { describe, expect, it } from "vitest";
import { calcularSlots, slotsLivresFuturos, type BloqueioNoSlot, type ReservaNoSlot } from "./slots";

const DATA = "2026-10-20"; // terça
const MADRUGADA = new Date("2026-10-20T03:00:00Z"); // 00:00 em São Paulo

function reserva(inicio: string, fim: string): ReservaNoSlot {
  return {
    id: "r1",
    clienteId: "c1",
    clienteNome: "Ana",
    clienteTelefone: "5547999990000",
    observacoes: null,
    inicio: new Date(inicio),
    fim: new Date(fim),
  };
}

function bloqueio(inicio: string, fim: string): BloqueioNoSlot {
  return { id: "b1", motivo: "Manutenção", inicio: new Date(inicio), fim: new Date(fim) };
}

describe("calcularSlots", () => {
  it("gera slots de 1h dentro do funcionamento, em UTC corretamente", () => {
    const slots = calcularSlots({
      data: DATA,
      funcionamento: { abertura: "08:00:00", fechamento: "12:00:00" },
      reservas: [],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => s.hora)).toEqual([8, 9, 10, 11]);
    // 08:00 em São Paulo (UTC-3) = 11:00 UTC
    expect(slots[0].inicio.toISOString()).toBe("2026-10-20T11:00:00.000Z");
    expect(slots[0].fim.toISOString()).toBe("2026-10-20T12:00:00.000Z");
    expect(slots.every((s) => s.estado === "livre")).toBe(true);
  });

  it("sem funcionamento no dia, não há slots", () => {
    expect(calcularSlots({ data: DATA, funcionamento: null, reservas: [], bloqueios: [] })).toEqual([]);
  });

  it("ignora frações de hora no funcionamento", () => {
    const slots = calcularSlots({
      data: DATA,
      funcionamento: { abertura: "08:30:00", fechamento: "11:30:00" },
      reservas: [],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => s.hora)).toEqual([9, 10]);
  });

  it("aceita fechamento à meia-noite (24:00)", () => {
    const slots = calcularSlots({
      data: DATA,
      funcionamento: { abertura: "22:00:00", fechamento: "24:00:00" },
      reservas: [],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => s.hora)).toEqual([22, 23]);
    expect(slots[1].fim.toISOString()).toBe("2026-10-21T03:00:00.000Z");
  });

  it("marca reservado e bloqueado, com reserva tendo prioridade", () => {
    const slots = calcularSlots({
      data: DATA,
      funcionamento: { abertura: "18:00:00", fechamento: "21:00:00" },
      reservas: [reserva("2026-10-20T19:00:00-03:00", "2026-10-20T20:00:00-03:00")],
      bloqueios: [bloqueio("2026-10-20T19:00:00-03:00", "2026-10-20T21:00:00-03:00")],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => s.estado)).toEqual(["livre", "reservado", "bloqueado"]);
    expect(slots[1].reserva?.clienteNome).toBe("Ana");
    expect(slots[2].bloqueio?.motivo).toBe("Manutenção");
  });

  it("bloqueio de dia inteiro bloqueia todos os slots", () => {
    const slots = calcularSlots({
      data: DATA,
      funcionamento: { abertura: "08:00:00", fechamento: "23:00:00" },
      reservas: [],
      bloqueios: [bloqueio("2026-10-20T00:00:00-03:00", "2026-10-21T00:00:00-03:00")],
      agora: MADRUGADA,
    });
    expect(slots).toHaveLength(15);
    expect(slots.every((s) => s.estado === "bloqueado")).toBe(true);
  });

  it("reserva encostada não ocupa o slot vizinho", () => {
    const slots = calcularSlots({
      data: DATA,
      funcionamento: { abertura: "18:00:00", fechamento: "21:00:00" },
      reservas: [reserva("2026-10-20T19:00:00-03:00", "2026-10-20T20:00:00-03:00")],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots[0].estado).toBe("livre");
    expect(slots[2].estado).toBe("livre");
  });

  it("marca passado e agora", () => {
    const slots = calcularSlots({
      data: DATA,
      funcionamento: { abertura: "18:00:00", fechamento: "21:00:00" },
      reservas: [],
      bloqueios: [],
      agora: new Date("2026-10-20T19:30:00-03:00"),
    });
    expect(slots.map((s) => [s.passado, s.agora])).toEqual([
      [true, false],
      [false, true],
      [false, false],
    ]);
    expect(slotsLivresFuturos(slots).map((s) => s.hora)).toEqual([19, 20]);
  });
});
