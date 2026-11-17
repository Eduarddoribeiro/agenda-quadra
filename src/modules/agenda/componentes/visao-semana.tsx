import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { EscudoCabecalho } from "@/components/escudo-cabecalho";
import { DIAS_SEMANA_CURTOS, diaDaSemana, formatarData, rotuloHorario, somarDias, type DataISO } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { textoHorariosLivres } from "../compartilhar";
import type { AgendaDia } from "../consultas";
import { DURACAO_SLOT, slotsLivresFuturos, type Slot } from "../slots";
import { BotaoCompartilhar } from "./botao-compartilhar";

function corDaCelula(slot: Slot) {
  // Reservado em cinza: o branco fica só para marcar o dia de hoje.
  if (slot.estado === "reservado") return slot.passado ? "bg-foreground/25" : "bg-foreground/45";
  if (slot.estado === "bloqueado") return slot.passado ? "bg-amarelo/40" : "bg-amarelo";
  return slot.passado ? "bg-foreground/12" : "bg-livre/80";
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

  // Eixo de tempo em colunas de 30 min: da primeira abertura ao último fechamento da semana.
  // Assim um jogo das 18h30 fica deslocado meia coluna em relação ao das 18h.
  const minutos = dias.flatMap((d) => d.slots.map((s) => s.minuto));
  const primeira = minutos.length ? Math.min(...minutos) : 8 * 60;
  const ultima = minutos.length ? Math.max(...minutos) + DURACAO_SLOT : 23 * 60;
  const colunas = (ultima - primeira) / 30;
  // Marcas da régua a cada 3 horas a partir da abertura, cada uma no começo da sua coluna.
  const marcas: number[] = [];
  for (let m = primeira; m <= ultima - 120; m += 180) marcas.push(m);

  return (
    <div>
      <header className="cabecalho sticky top-0 z-30 bg-background px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <EscudoCabecalho />
          <div className="min-w-0 flex-1">
            <h1 className="titulo-tela font-placar text-[2.25rem] leading-[0.85]">Semana</h1>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">{intervaloDaSemana(segunda)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!semanaAtual && (
              <Link
                href="/semana"
                className="mr-1 flex h-10 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
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

      <div className="px-4 pt-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="text-sm">
            {totalLivres > 0 ? (
              <strong className="text-livre">
                {totalLivres} {totalLivres === 1 ? "horário livre" : "horários livres"}
              </strong>
            ) : (
              <strong>Semana sem horários livres</strong>
            )}
          </p>
          {totalLivres > 0 && <BotaoCompartilhar texto={texto} rotulo="Compartilhar horários livres da semana" compacto />}
        </div>

        {/* Legenda antes das barras: sem ela, as cores não dizem nada */}
        <ul className="mt-2 mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Legenda">
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-livre/80" />Livre</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-foreground/45" />Reservado</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-amarelo" />Bloqueado</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-foreground/12" />Já passou</li>
        </ul>

        {/* Régua de horas alinhada com as faixas */}
        <div className="grid grid-cols-[2.75rem_1fr_3rem] gap-2.5 px-[13px] pb-1 text-[11px] text-muted-foreground" aria-hidden>
          <span />
          <div className="relative h-4">
            {marcas.map((m) => (
              <span key={m} className="absolute" style={{ left: `${((m - primeira) / (ultima - primeira)) * 100}%` }}>
                {rotuloHorario(m)}
              </span>
            ))}
          </div>
          <span />
        </div>

        <ol className="space-y-1.5">
          {dias.map((dia) => {
            const livres = slotsLivresFuturos(dia.slots).length;
            const passou = dia.data < hoje;
            const ehHoje = dia.data === hoje;
            return (
              <li key={dia.data}>
                <Link
                  href={ehHoje ? "/" : `/?data=${dia.data}`}
                  className={cn(
                    "grid min-h-12 grid-cols-[2.75rem_1fr_3rem] items-center gap-2.5 rounded-xl border bg-card px-3 py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted",
                    ehHoje && "border-2 border-foreground",
                  )}
                >
                  <span className="flex flex-col leading-none">
                    <span className={cn("text-xs", ehHoje ? "font-bold text-agora" : "text-muted-foreground")}>
                      {ehHoje ? "hoje" : DIAS_SEMANA_CURTOS[diaDaSemana(dia.data)]}
                    </span>
                    <span className={cn("font-placar text-[1.5rem]", passou && "text-muted-foreground")}>
                      {Number(dia.data.slice(8))}
                    </span>
                  </span>

                  {dia.aberto ? (
                    <span
                      className="grid h-6 gap-[3px]"
                      style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
                      aria-hidden
                    >
                      {dia.slots.map((s) => (
                        <span
                          key={s.minuto}
                          className={cn("rounded-[3px]", corDaCelula(s))}
                          style={{ gridColumn: `${(s.minuto - primeira) / 30 + 1} / span ${DURACAO_SLOT / 30}` }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}

                  <span className="text-right text-sm leading-tight">
                    {!dia.aberto || passou ? null : livres > 0 ? (
                      <>
                        <strong className="font-placar block text-[1.25rem] text-livre">{livres}</strong>
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

      </div>
    </div>
  );
}
