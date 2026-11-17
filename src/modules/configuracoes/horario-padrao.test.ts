import { describe, expect, it } from "vitest";
import type { HorarioDia } from "./consultas";
import { estadoInicial, horariosDoEstado } from "./horario-padrao";

const cheio = [{ abertura: "08:00", fechamento: "23:00" }];
const domingo = [{ abertura: "08:00", fechamento: "18:00" }];
const quebrado = [
  { abertura: "08:00", fechamento: "18:00" },
  { abertura: "18:30", fechamento: "22:30" },
];

function semana(porDia: Record<number, HorarioDia["periodos"]>): HorarioDia[] {
  return [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({ diaSemana, periodos: porDia[diaSemana] ?? [] }));
}

describe("horário padrão e dias diferentes", () => {
  it("o horário mais comum vira o padrão; o resto vira dia com horário próprio ou fechado", () => {
    const horarios = semana({ 0: domingo, 1: cheio, 2: cheio, 3: quebrado, 4: cheio, 5: cheio });
    const estado = estadoInicial(horarios);
    expect(estado.padrao).toEqual(cheio);
    expect(estado.modos).toEqual({ 0: "proprio", 1: "padrao", 2: "padrao", 3: "proprio", 4: "padrao", 5: "padrao", 6: "fechado" });
    expect(estado.proprios[3]).toEqual(quebrado);
  });

  it("volta ao formato salvo sem mudar nada", () => {
    const horarios = semana({ 0: domingo, 1: cheio, 2: cheio, 3: quebrado, 4: cheio, 5: cheio });
    expect(horariosDoEstado(estadoInicial(horarios))).toEqual(horarios);
  });

  it("mudar o padrão muda todos os dias que seguem ele, e só eles", () => {
    const estado = estadoInicial(semana({ 0: domingo, 1: cheio, 2: cheio, 3: cheio }));
    const novo = [{ abertura: "08:00", fechamento: "22:00" }];
    const salvo = horariosDoEstado({ ...estado, padrao: novo });
    expect(salvo.map((d) => d.periodos)).toEqual([domingo, novo, novo, novo, [], [], []]);
  });

  it("tudo fechado: o padrão começa em 08h às 23h", () => {
    expect(estadoInicial(semana({})).padrao).toEqual(cheio);
  });
});
