// Lógica pura (sem banco) da tela de horários: um horário padrão para a semana
// e os dias que fogem dele. O banco continua guardando os períodos de cada dia.
import type { HorarioDia, PeriodoHHMM } from "./consultas";

// Segunda primeiro, como o dono pensa a semana.
export const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0];
const PADRAO_INICIAL: PeriodoHHMM[] = [{ abertura: "08:00", fechamento: "23:00" }];

/** Como cada dia usa o horário: o padrão da semana, um horário só dele, ou fechado. */
export type ModoDia = "padrao" | "proprio" | "fechado";

export type Estado = {
  padrao: PeriodoHHMM[];
  modos: Record<number, ModoDia>;
  /** Horário dos dias em modo "proprio" (fica guardado mesmo se o dia fechar e abrir de novo). */
  proprios: Record<number, PeriodoHHMM[]>;
};

const chaveDosPeriodos = (ps: PeriodoHHMM[]) => JSON.stringify(ps);

/**
 * O horário padrão é o mais comum entre os dias abertos; o resto vira dia com horário próprio.
 * Assim "segunda a sábado 08h–23h, domingo até 18h" aparece como um padrão e uma diferença.
 */
export function estadoInicial(horarios: HorarioDia[]): Estado {
  const contagem = new Map<string, number>();
  for (const dia of ORDEM_DIAS) {
    const ps = horarios.find((h) => h.diaSemana === dia)?.periodos ?? [];
    if (ps.length) contagem.set(chaveDosPeriodos(ps), (contagem.get(chaveDosPeriodos(ps)) ?? 0) + 1);
  }
  let maisComum: string | null = null;
  for (const [chave, n] of contagem) if (maisComum === null || n > contagem.get(maisComum)!) maisComum = chave;
  const padrao: PeriodoHHMM[] = maisComum ? JSON.parse(maisComum) : PADRAO_INICIAL;

  const modos: Record<number, ModoDia> = {};
  const proprios: Record<number, PeriodoHHMM[]> = {};
  for (const dia of ORDEM_DIAS) {
    const ps = horarios.find((h) => h.diaSemana === dia)?.periodos ?? [];
    if (!ps.length) modos[dia] = "fechado";
    else if (chaveDosPeriodos(ps) === chaveDosPeriodos(padrao)) modos[dia] = "padrao";
    else {
      modos[dia] = "proprio";
      proprios[dia] = ps;
    }
  }
  return { padrao, modos, proprios };
}

/** De volta ao formato salvo: os 7 dias, domingo (0) a sábado (6). */
export function horariosDoEstado({ padrao, modos, proprios }: Estado): HorarioDia[] {
  return [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
    diaSemana,
    periodos: modos[diaSemana] === "fechado" ? [] : modos[diaSemana] === "proprio" ? proprios[diaSemana] : padrao,
  }));
}
