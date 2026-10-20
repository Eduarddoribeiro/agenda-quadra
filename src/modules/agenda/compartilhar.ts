import { formatarData, horaCurta, nomeDoDia, type DataISO } from "@/lib/datas";
import { slotsLivresFuturos, type Slot } from "./slots";

function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`;
}

function rotuloDoDia(data: DataISO): string {
  return `${nomeDoDia(data)}, ${formatarData(data, "dd/MM")}`;
}

/**
 * Texto pronto para colar no WhatsApp com os horários livres (só os que ainda não passaram).
 * Usa *negrito* do WhatsApp nos dias.
 */
export function textoHorariosLivres(dias: { data: DataISO; slots: Slot[] }[]): string | null {
  const blocos = dias
    .map(({ data, slots }) => ({ data, livres: slotsLivresFuturos(slots) }))
    .filter((d) => d.livres.length > 0)
    .map(({ data, livres }) => `*${rotuloDoDia(data)}*\n${juntar(livres.map((s) => horaCurta(s.hora)))}`);

  if (blocos.length === 0) return null;
  return `Horários livres na quadra ⚽\n\n${blocos.join("\n\n")}\n\nPara reservar, é só responder aqui.`;
}
