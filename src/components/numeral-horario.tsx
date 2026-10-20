import { partesHorario } from "@/lib/datas";
import { cn } from "@/lib/utils";

/** Numeral de placar: "18" grande e o "h30" (ou "h") pequeno, alinhado no topo. */
export function NumeralHorario({ minuto, className }: { minuto: number; className?: string }) {
  const { hh, sufixo } = partesHorario(minuto);
  return (
    <span className={cn("font-placar inline-flex items-start select-none", className)}>
      {hh}
      <span className="mt-[0.15em] ml-0.5 text-[0.36em] leading-none font-bold">{sufixo}</span>
    </span>
  );
}
