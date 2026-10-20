import { describe, expect, it } from "vitest";
import { datasDoFixo } from "./recorrencia";

describe("datasDoFixo", () => {
  it("lista as quartas a partir do início", () => {
    expect(
      datasDoFixo({ diaSemana: 3, inicioVigencia: "2026-10-21", fimVigencia: null, geradaAte: "2026-10-20", ate: "2026-11-11" }),
    ).toEqual(["2026-10-21", "2026-10-28", "2026-11-04", "2026-11-11"]);
  });

  it("continua de onde parou, sem repetir datas já geradas", () => {
    expect(
      datasDoFixo({ diaSemana: 3, inicioVigencia: "2026-10-21", fimVigencia: null, geradaAte: "2026-10-28", ate: "2026-11-10" }),
    ).toEqual(["2026-11-04"]);
  });

  it("para no fim da vigência", () => {
    expect(
      datasDoFixo({ diaSemana: 3, inicioVigencia: "2026-10-21", fimVigencia: "2026-10-30", geradaAte: "2026-10-20", ate: "2026-12-31" }),
    ).toEqual(["2026-10-21", "2026-10-28"]);
  });

  it("não gera nada quando já está em dia", () => {
    expect(
      datasDoFixo({ diaSemana: 3, inicioVigencia: "2026-10-21", fimVigencia: null, geradaAte: "2026-11-11", ate: "2026-11-11" }),
    ).toEqual([]);
  });

  it("encerrado antes de começar não gera nada", () => {
    expect(
      datasDoFixo({ diaSemana: 3, inicioVigencia: "2026-10-21", fimVigencia: "2026-10-20", geradaAte: "2026-10-20", ate: "2026-12-31" }),
    ).toEqual([]);
  });
});
