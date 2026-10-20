import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { DIAS_SEMANA_CURTOS, diaDaSemana, formatarData, horaCurta, somarDias, type DataISO } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { textoHorariosLivres } from "../compartilhar";
import type { AgendaDia } from "../consultas";
import { slotsLivresFuturos, type Slot } from "../slots";
import { BotaoCompartilhar } from "./botao-compartilhar";

function corDaCelula(slot: Slot) {
  if (slot.estado === "reservado") return slot.passado ? "bg-foreground/35" : "bg-foreground";
  if (slot.estado === "bloqueado") return slot.passado ? "bg-amarelo/40" : "bg-amarelo";
  return slot.passado ? "bg-muted" : "bg-livre/80";
}

function intervaloDaSemana(segunda: DataISO) {
  const domingo = somarDias(segunda, 6);
  const mesmoMes = segunda.slice(5, 7) === domingo.slice(5, 7);
  return mesmoMes
    ? `${formatarData(segunda, "d")} a ${formatarData(domingo, "d 'de' MMMM")}`
    : `${formatarData(segunda, "d 'de' MMM")} a ${formatarData(domingo, "d 'de' MMM")}`;
}

export function VisaoSemana({ dias, segunda, hoje }: { dias: AgendaDia[]; segunda: DataISO; hoje: DataISO }) {
  const semanaAtual = segunda <= hoje && hoje <= somarDias(segunda, 6);
  const texto = textoHorariosLivres(dias.filter((d) => d.data >= hoje));
  const totalLivres = dias.reduce((soma, d) => soma + slotsLivresFuturos(d.slots).length, 0);

  // Eixo de horas: da primeira abertura ao último fechamento da semana.
  const horas = dias.flatMap((d) => d.slots.map((s) => s.hora));
  const primeira = horas.length ? Math.min(...horas) : 8;
  const ultima = horas.length ? Math.max(...horas) + 1 : 23;
  const colunas = ultima - primeira;

  return (
    <div>
      <header className="sticky top-0 z-30 border-b bg-background px-4 pt-4 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-placar text-[3.25rem] leading-[0.85]">Semana</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{intervaloDaSemana(segunda)}</p>
          </div>
          <div className="flex items-center gap-1">
            {!semanaAtual && (
              <Link
                href="/semana"
                className="mr-1 flex h-11 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                Atual
              </Link>
            )}
            <Link
              href={`/semana?inicio=${somarDias(segunda, -7)}`}
              aria-label="Semana anterior"
              className="grid size-11 place-items-center rounded-full border bg-card active:bg-muted"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <Link
              href={`/semana?inicio=${somarDias(segunda, 7)}`}
              aria-label="Próxima semana"
              className="grid size-11 place-items-center rounded-full border bg-card active:bg-muted"
            >
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm">
            {totalLivres > 0 ? (
              <strong className="text-livre">
                {totalLivres} {totalLivres === 1 ? "horário livre" : "horários livres"}
              </strong>
            ) : (
              <strong>Semana sem horários livres</strong>
            )}
          </p>
          {totalLivres > 0 && <BotaoCompartilhar texto={texto} rotulo="Compartilhar semana" />}
        </div>

        {/* Régua de horas alinhada com as faixas */}
        <div className="grid grid-cols-[3.5rem_1fr_4.25rem] gap-3 pb-1 text-[11px] text-muted-foreground" aria-hidden>
          <span />
          <div className="flex justify-between">
            <span>{horaCurta(primeira)}</span>
            <span>{horaCurta(primeira + Math.round(colunas / 2))}</span>
            <span>{horaCurta(ultima)}</span>
          </div>
          <span />
        </div>

        <ol className="space-y-2">
          {dias.map((dia) => {
            const livres = slotsLivresFuturos(dia.slots).length;
            const passou = dia.data < hoje;
            const ehHoje = dia.data === hoje;
            return (
              <li key={dia.data}>
                <Link
                  href={ehHoje ? "/" : `/?data=${dia.data}`}
                  className={cn(
                    "grid min-h-18 grid-cols-[3.5rem_1fr_4.25rem] items-center gap-3 rounded-xl border bg-card px-3 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted",
                    ehHoje && "border-2 border-foreground",
                    passou && "opacity-55",
                  )}
                >
                  <span className="flex flex-col leading-none">
                    <span className={cn("text-xs", ehHoje ? "font-bold text-agora" : "text-muted-foreground")}>
                      {ehHoje ? "hoje" : DIAS_SEMANA_CURTOS[diaDaSemana(dia.data)]}
                    </span>
                    <span className="font-placar mt-1 text-[2.25rem]">{Number(dia.data.slice(8))}</span>
                  </span>

                  {dia.aberto ? (
                    <span
                      className="grid h-9 gap-[3px]"
                      style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
                      aria-hidden
                    >
                      {dia.slots.map((s) => (
                        <span
                          key={s.hora}
                          className={cn("rounded-[3px]", corDaCelula(s))}
                          style={{ gridColumnStart: s.hora - primeira + 1 }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}

                  <span className="text-right text-sm leading-tight">
                    {!dia.aberto || passou ? null : livres > 0 ? (
                      <>
                        <strong className="font-placar block text-2xl text-livre">{livres}</strong>
                        <span className="text-xs text-muted-foreground">{livres === 1 ? "livre" : "livres"}</span>
                      </>
                    ) : (
                      <strong className="text-xs">Lotado</strong>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Legenda">
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-livre/80" />Livre</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-foreground" />Reservado</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-amarelo" />Bloqueado</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-muted" />Já passou</li>
        </ul>
      </div>
    </div>
  );
}
