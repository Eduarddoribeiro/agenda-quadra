import { describe, expect, it } from "vitest";
import { textoHorariosLivres } from "./compartilhar";
import { calcularSlots } from "./slots";

const agora = new Date("2026-10-20T03:00:00Z");

describe("textoHorariosLivres", () => {
  it("lista os horários livres por dia", () => {
    const slots = calcularSlots({
      data: "2026-10-20",
      periodos: [{ abertura: "19:00:00", fechamento: "22:00:00" }],
      reservas: [
        {
          id: "r",
          clienteId: "c",
          clienteNome: "Ana",
          clienteTelefone: null,
          observacoes: null,
          fixaId: null,
          inicio: new Date("2026-10-20T20:00:00-03:00"),
          fim: new Date("2026-10-20T21:00:00-03:00"),
        },
      ],
      bloqueios: [],
      agora,
    });
    expect(textoHorariosLivres([{ data: "2026-10-20", slots }])).toBe(
      "Horários livres na quadra ⚽\n\n*Terça, 20/10*\n19h e 21h\n\nPara reservar, é só responder aqui.",
    );
  });

  it("retorna null quando não há nada livre", () => {
    expect(textoHorariosLivres([{ data: "2026-10-20", slots: [] }])).toBeNull();
  });
});
