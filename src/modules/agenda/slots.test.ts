import { describe, expect, it } from "vitest";
import { rotuloHorario } from "@/lib/datas";
import { calcularSlots, conflitoNoIntervalo, juntarPassadosLivres, linhasDoDia, slotsLivresFuturos, type BloqueioNoSlot, type ReservaNoSlot } from "./slots";

const DATA = "2026-10-20"; // terça
const MADRUGADA = new Date("2026-10-20T03:00:00Z"); // 00:00 em São Paulo

function reserva(inicio: string, fim: string): ReservaNoSlot {
  return {
    id: "r1",
    clienteId: "c1",
    clienteNome: "Ana",
    clienteTelefone: "5547999990000",
    observacoes: null,
    fixaId: null,
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
      periodos: [{ abertura: "08:00:00", fechamento: "12:00:00" }],
      reservas: [],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => s.minuto / 60)).toEqual([8, 9, 10, 11]);
    // 08:00 em São Paulo (UTC-3) = 11:00 UTC
    expect(slots[0].inicio.toISOString()).toBe("2026-10-20T11:00:00.000Z");
    expect(slots[0].fim.toISOString()).toBe("2026-10-20T12:00:00.000Z");
    expect(slots.every((s) => s.estado === "livre")).toBe(true);
  });

  it("sem funcionamento no dia, não há slots", () => {
    expect(calcularSlots({ data: DATA, periodos: [], reservas: [], bloqueios: [] })).toEqual([]);
  });

  it("período que começa na meia hora gera slots na meia hora", () => {
    const slots = calcularSlots({
      data: DATA,
      periodos: [{ abertura: "08:30:00", fechamento: "11:45:00" }],
      reservas: [],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => rotuloHorario(s.minuto))).toEqual(["08h30", "09h30", "10h30"]);
    expect(slots[0].inicio.toISOString()).toBe("2026-10-20T11:30:00.000Z");
  });

  it("quarta com dois períodos: horas cheias até 18h, depois 18h30 a 22h30", () => {
    const slots = calcularSlots({
      data: "2026-10-21",
      periodos: [
        { abertura: "18:30:00", fechamento: "22:30:00" },
        { abertura: "16:00:00", fechamento: "18:00:00" },
      ],
      reservas: [reserva("2026-10-21T18:30:00-03:00", "2026-10-21T19:30:00-03:00")],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => rotuloHorario(s.minuto))).toEqual(["16h", "17h", "18h30", "19h30", "20h30", "21h30"]);
    expect(slots.map((s) => s.estado)).toEqual(["livre", "livre", "reservado", "livre", "livre", "livre"]);
    expect(slots.at(-1)!.fim.toISOString()).toBe("2026-10-22T01:30:00.000Z");
  });

  it("reserva antiga das 18h ocupa os dois slots que encosta na meia hora", () => {
    const slots = calcularSlots({
      data: DATA,
      periodos: [{ abertura: "17:30:00", fechamento: "19:30:00" }],
      reservas: [reserva("2026-10-20T18:00:00-03:00", "2026-10-20T19:00:00-03:00")],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => s.estado)).toEqual(["reservado", "reservado"]);
  });

  it("aceita fechamento à meia-noite (24:00)", () => {
    const slots = calcularSlots({
      data: DATA,
      periodos: [{ abertura: "22:00:00", fechamento: "24:00:00" }],
      reservas: [],
      bloqueios: [],
      agora: MADRUGADA,
    });
    expect(slots.map((s) => s.minuto / 60)).toEqual([22, 23]);
    expect(slots[1].fim.toISOString()).toBe("2026-10-21T03:00:00.000Z");
  });

  it("marca reservado e bloqueado, com reserva tendo prioridade", () => {
    const slots = calcularSlots({
      data: DATA,
      periodos: [{ abertura: "18:00:00", fechamento: "21:00:00" }],
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
      periodos: [{ abertura: "08:00:00", fechamento: "23:00:00" }],
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
      periodos: [{ abertura: "18:00:00", fechamento: "21:00:00" }],
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
      periodos: [{ abertura: "18:00:00", fechamento: "21:00:00" }],
      reservas: [],
      bloqueios: [],
      agora: new Date("2026-10-20T19:30:00-03:00"),
    });
    expect(slots.map((s) => [s.passado, s.agora])).toEqual([
      [true, false],
      [false, true],
      [false, false],
    ]);
    expect(slotsLivresFuturos(slots).map((s) => s.minuto / 60)).toEqual([19, 20]);
  });
});

describe("jogo fora da grade (vôlei das 14h30 às 16h)", () => {
  const params = {
    data: DATA,
    periodos: [{ abertura: "13:00:00", fechamento: "18:00:00" }],
    reservas: [reserva("2026-10-20T14:30:00-03:00", "2026-10-20T16:00:00-03:00")],
    bloqueios: [],
    agora: MADRUGADA,
  };

  it("ocupa os slots das 14h e das 15h, mas aparece numa linha só", () => {
    const slots = calcularSlots(params);
    expect(slots.map((s) => s.estado)).toEqual(["livre", "reservado", "reservado", "livre", "livre"]);
    expect(linhasDoDia(slots).map((s) => rotuloHorario(s.minuto))).toEqual(["13h", "14h", "16h", "17h"]);
  });

  it("acusa conflito com quem já tem parte do horário", () => {
    const slots = calcularSlots(params);
    const das = (inicio: string, fim: string) => ({ inicio: new Date(inicio), fim: new Date(fim) });
    expect(conflitoNoIntervalo(slots, das("2026-10-20T13:00:00-03:00", "2026-10-20T14:30:00-03:00"))).toBeUndefined();
    expect(conflitoNoIntervalo(slots, das("2026-10-20T13:30:00-03:00", "2026-10-20T15:00:00-03:00"))?.reserva?.clienteNome).toBe("Ana");
    expect(conflitoNoIntervalo(slots, das("2026-10-20T16:00:00-03:00", "2026-10-20T17:30:00-03:00"))).toBeUndefined();
  });
});

describe("juntarPassadosLivres", () => {
  it("horas livres que já passaram viram uma linha só; jogos passados continuam", () => {
    const slots = calcularSlots({
      data: DATA,
      periodos: [{ abertura: "08:00:00", fechamento: "14:00:00" }],
      reservas: [reserva("2026-10-20T13:00:00Z", "2026-10-20T14:00:00Z")], // 10h
      bloqueios: [],
      agora: new Date("2026-10-20T15:30:00Z"), // 12h30
    });
    const linhas = juntarPassadosLivres(linhasDoDia(slots));
    expect(linhas.map((l) => ("tipo" in l ? `${l.de / 60}-${l.ate / 60}` : l.estado))).toEqual([
      "8-10",
      "reservado",
      "11-12",
      "livre",
      "livre",
    ]);
  });
});
