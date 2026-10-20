import { DIAS_SEMANA, diaDaSemana, rotuloHorario, somarDias, type DataISO } from "@/lib/datas";

// Lógica pura dos horários fixos (sem banco).

/** Quantas semanas à frente um horário fixo novo já sai marcado. */
export const SEMANAS_INICIAIS = 12;

/**
 * Datas em que o fixo cai, depois de `geradaAte` (exclusivo) até `ate` (inclusivo),
 * respeitando o começo e o fim da vigência.
 */
export function datasDoFixo(params: {
  diaSemana: number;
  inicioVigencia: DataISO;
  fimVigencia: DataISO | null;
  geradaAte: DataISO;
  ate: DataISO;
}): DataISO[] {
  const { diaSemana, inicioVigencia, fimVigencia, geradaAte, ate } = params;
  const limite = fimVigencia && fimVigencia < ate ? fimVigencia : ate;

  let data = somarDias(geradaAte, 1);
  if (data < inicioVigencia) data = inicioVigencia;
  // Avança até o primeiro dia da semana certo.
  data = somarDias(data, (diaSemana - diaDaSemana(data) + 7) % 7);

  const datas: DataISO[] = [];
  for (; data <= limite; data = somarDias(data, 7)) datas.push(data);
  return datas;
}

/** "toda quarta às 18h30" / "todo sábado às 9h" */
export function rotuloFixo(diaSemana: number, minuto: number): string {
  const dia = DIAS_SEMANA[diaSemana].toLowerCase();
  const artigo = diaSemana === 0 || diaSemana === 6 ? "todo" : "toda";
  return `${artigo} ${dia} às ${rotuloHorario(minuto)}`;
}
