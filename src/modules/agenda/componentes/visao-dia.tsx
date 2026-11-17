"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { EscudoCabecalho } from "@/components/escudo-cabecalho";
import {
  DIAS_SEMANA_CURTOS,
  diaDaSemana,
  formatarData,
  inicioDaSemana,
  nomeDoDia,
  rotuloHorario,
  somarDias,
  type DataISO,
} from "@/lib/datas";
import { cn } from "@/lib/utils";
import { textoHorariosLivres } from "../compartilhar";
import type { AgendaDia } from "../consultas";
import { juntarPassadosLivres, linhasDoDia, separarPassados, slotsLivresFuturos, type Slot } from "../slots";
import { BotaoCompartilhar } from "./botao-compartilhar";
import { DrawerReserva } from "./drawer-reserva";
import { DrawerReservar } from "./drawer-reservar";
import { LinhaSlot } from "./linha-slot";

/** Uma letra por horário de cada dia: l livre, r reservado, b bloqueado, p já passou. */
export type OcupacaoSemana = Record<DataISO, string>;

const hrefDoDia = (data: DataISO, hoje: DataISO) => (data === hoje ? "/" : `/?data=${data}`);

const COR_OCUPACAO: Record<string, string> = {
  l: "bg-livre",
  r: "bg-foreground/45",
  b: "bg-amarelo",
  p: "bg-foreground/12",
};

/** Mini placar do dia na faixa da semana: uma pastilha por horário. */
function MiniOcupacao({ letras, selecionado }: { letras: string | undefined; selecionado: boolean }) {
  if (!letras) return <span aria-hidden className="mt-1 h-1" />;
  return (
    <span aria-hidden className="mt-1 flex h-1 w-[78%] gap-px">
      {[...letras].map((l, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 rounded-[1px]",
            selecionado && l === "r" ? "bg-primary-foreground/40" : selecionado && l === "p" ? "bg-primary-foreground/15" : COR_OCUPACAO[l],
          )}
        />
      ))}
    </span>
  );
}

export function VisaoDia({
  dia,
  hoje,
  ocupacao,
  abrirReserva,
}: {
  dia: AgendaDia;
  hoje: DataISO;
  ocupacao: OcupacaoSemana;
  /** Veio do botão "Reservar" da barra: abre a gaveta no próximo horário livre. */
  abrirReserva: "sim" | "sem-livres" | null;
}) {
  const { data, slots, aberto } = dia;
  const router = useRouter();
  const [trocandoDia, startTroca] = useTransition();
  const [slotReservar, setSlotReservar] = useState<Slot | null>(null);
  const [slotAberto, setSlotAberto] = useState<Slot | null>(null);
  const [verPassados, setVerPassados] = useState(false);

  const ehHoje = data === hoje;
  const livres = useMemo(() => slotsLivresFuturos(slots), [slots]);
  const linhas = useMemo(() => linhasDoDia(slots), [slots]);
  // Hoje, tudo o que já terminou vira uma linha no topo: o dono abre e já vê o que vem agora.
  const { passados, resto } = useMemo(() => {
    const separados = separarPassados(linhas);
    return ehHoje && separados.passados && separados.passados.linhas.length >= 2
      ? separados
      : { passados: null, resto: linhas };
  }, [linhas, ehHoje]);
  const linhasNaTela = useMemo(() => juntarPassadosLivres(resto), [resto]);
  const linhasPassadas = useMemo(() => (passados ? juntarPassadosLivres(passados.linhas) : []), [passados]);
  const jogos = linhas.filter((s) => s.estado === "reservado").length;
  const texto = useMemo(() => textoHorariosLivres([{ data, slots }]), [data, slots]);

  // Botão "Reservar" da barra: abre a gaveta no próximo horário livre. É um ajuste de estado
  // durante a renderização (cada pedido novo abre uma vez), sem efeito em cascata.
  const [pedidoAtendido, setPedidoAtendido] = useState<typeof abrirReserva>(null);
  if (abrirReserva !== pedidoAtendido) {
    setPedidoAtendido(abrirReserva);
    // Prefere um horário que ainda não começou; o que está rolando livre fica de reserva.
    const alvo = livres.find((s) => !s.agora) ?? livres[0];
    if (abrirReserva === "sim" && alvo) setSlotReservar(alvo);
  }
  // Depois limpa o endereço, para recarregar a página não abrir a gaveta de novo.
  useEffect(() => {
    if (!abrirReserva) return;
    if (abrirReserva === "sem-livres") toast("Nenhum horário livre nos próximos 14 dias.");
    router.replace(hrefDoDia(data, hoje), { scroll: false });
  }, [abrirReserva, router, data, hoje]);

  function irPara(destino: DataISO) {
    startTroca(() => router.push(hrefDoDia(destino, hoje), { scroll: false }));
  }

  // Deslizar para os lados troca de dia. O conteúdo acompanha o dedo para mostrar o gesto.
  const toque = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);
  const [arrasto, setArrasto] = useState(0);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    toque.current = { x: t.clientX, y: t.clientY, horizontal: null };
  }
  function onTouchMove(e: React.TouchEvent) {
    const inicio = toque.current;
    if (!inicio) return;
    const dx = e.touches[0].clientX - inicio.x;
    const dy = e.touches[0].clientY - inicio.y;
    if (inicio.horizontal === null && Math.hypot(dx, dy) > 10) inicio.horizontal = Math.abs(dx) > Math.abs(dy) * 1.4;
    if (inicio.horizontal) setArrasto(dx * 0.35);
  }
  function onTouchEnd(e: React.TouchEvent) {
    const inicio = toque.current;
    toque.current = null;
    setArrasto(0);
    if (!inicio?.horizontal) return;
    const dx = e.changedTouches[0].clientX - inicio.x;
    if (Math.abs(dx) > 70) irPara(somarDias(data, dx < 0 ? 1 : -1));
  }

  const segunda = inicioDaSemana(data);

  return (
    <div>
      <header className="cabecalho sticky top-0 z-30 bg-background px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <EscudoCabecalho />
          <div className="min-w-0 flex-1">
            <h1 className="titulo-tela font-placar truncate text-[2.25rem] leading-[0.85]">
              {ehHoje ? "Hoje" : nomeDoDia(data)}
            </h1>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">
              {ehHoje ? `${nomeDoDia(data)}, ` : ""}
              {formatarData(data, "d 'de' MMM")}
            </p>
          </div>
          {!ehHoje && (
            <Link
              href="/"
              className="flex h-10 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              Hoje
            </Link>
          )}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => irPara(somarDias(data, -1))}
              aria-label="Dia anterior"
              className="grid size-11 place-items-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => irPara(somarDias(data, 1))}
              aria-label="Próximo dia"
              className="grid size-11 place-items-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Faixa da semana: pular direto para outro dia, já vendo como cada um está */}
        <nav aria-label="Dias da semana" className="mt-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => somarDias(segunda, i)).map((d) => {
            const selecionado = d === data;
            const ehDiaDeHoje = d === hoje;
            return (
              <Link
                key={d}
                href={hrefDoDia(d, hoje)}
                scroll={false}
                aria-current={selecionado ? "date" : undefined}
                aria-label={`${nomeDoDia(d)}, ${formatarData(d, "d 'de' MMMM")}${ehDiaDeHoje ? " (hoje)" : ""}`}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-lg text-[11px] leading-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
                  selecionado ? "bg-primary text-primary-foreground" : "text-muted-foreground active:bg-muted",
                )}
              >
                <span className={cn(ehDiaDeHoje && !selecionado && "font-bold text-agora")}>
                  {ehDiaDeHoje ? "hoje" : DIAS_SEMANA_CURTOS[diaDaSemana(d)]}
                </span>
                <span className={cn("text-base font-bold", !selecionado && (d < hoje ? "text-muted-foreground" : "text-foreground"))}>
                  {Number(d.slice(8))}
                </span>
                <MiniOcupacao letras={ocupacao[d]} selecionado={selecionado} />
              </Link>
            );
          })}
        </nav>
      </header>

      <section
        aria-label={`Horários de ${nomeDoDia(data)}`}
        aria-busy={trocandoDia}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn("px-4 pt-3 transition-opacity", trocandoDia && "opacity-50")}
        style={{
          transform: arrasto ? `translateX(${arrasto}px)` : undefined,
          transition: arrasto ? "none" : "transform 200ms ease-out, opacity 150ms",
        }}
      >
        {aberto ? (
          <>
            <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
              <p className="text-sm">
                {livres.length > 0 ? (
                  <strong className="text-livre">
                    {livres.length} {livres.length === 1 ? "livre" : "livres"}
                    {ehHoje && " até fechar"}
                  </strong>
                ) : (
                  <strong>{slots.some((s) => !s.passado) ? "Tudo reservado" : "Dia encerrado"}</strong>
                )}
                {jogos > 0 && (
                  <span className="text-muted-foreground">
                    {" "}· {jogos} {jogos === 1 ? "jogo" : "jogos"}
                  </span>
                )}
              </p>
              {livres.length > 0 && <BotaoCompartilhar texto={texto} rotulo="Compartilhar horários livres" compacto />}
            </div>

            <ol className="space-y-2">
              {passados && (
                <li>
                  <button
                    type="button"
                    onClick={() => setVerPassados((v) => !v)}
                    aria-expanded={verPassados}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-dashed px-4 text-left text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted"
                  >
                    <span>
                      {rotuloHorario(passados.de)} às {rotuloHorario(passados.ate)}
                      {" · "}
                      {[
                        passados.jogos > 0 && `${passados.jogos} ${passados.jogos === 1 ? "jogo" : "jogos"}`,
                        passados.livres > 0 && `${passados.livres} ${passados.livres === 1 ? "ficou livre" : "ficaram livres"}`,
                      ]
                        .filter(Boolean)
                        .join(", ") || "já passou"}
                    </span>
                    <ChevronDown className={cn("size-4 shrink-0 transition-transform", verPassados && "rotate-180")} aria-hidden />
                  </button>
                </li>
              )}
              {verPassados && linhasPassadas.map((l) => <Linha key={chave(l)} linha={l} onReservar={setSlotReservar} onAbrirReserva={setSlotAberto} />)}
              {linhasNaTela.map((l) => (
                <Linha key={chave(l)} linha={l} onReservar={setSlotReservar} onAbrirReserva={setSlotAberto} />
              ))}
            </ol>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border-2 border-dashed px-6 py-10 text-center">
            <p className="text-lg font-bold">Quadra fechada neste dia</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Para abrir neste dia da semana, ajuste o horário de funcionamento.
            </p>
            <Link
              href="/ajustes"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              Ajustar horários
            </Link>
          </div>
        )}
      </section>

      <DrawerReservar dia={dia} slot={slotReservar} onFechar={() => setSlotReservar(null)} />
      <DrawerReserva
        data={data}
        slot={slotAberto}
        livres={livres.filter((s) => s.minuto !== slotAberto?.minuto)}
        onFechar={() => setSlotAberto(null)}
      />
    </div>
  );
}

type LinhaDaTela = ReturnType<typeof juntarPassadosLivres>[number];

const chave = (l: LinhaDaTela) => ("tipo" in l ? `passados-${l.de}` : String(l.minuto));

function Linha({
  linha: l,
  onReservar,
  onAbrirReserva,
}: {
  linha: LinhaDaTela;
  onReservar: (s: Slot) => void;
  onAbrirReserva: (s: Slot) => void;
}) {
  if ("tipo" in l)
    return (
      <li className="grid grid-cols-[3.5rem_1fr] gap-2">
        <span aria-hidden />
        <p className="flex min-h-11 items-center rounded-xl border border-dashed px-4 text-sm text-muted-foreground">
          {rotuloHorario(l.de)} às {rotuloHorario(l.ate)} · {l.quantos === 1 ? "ficou livre" : "ficaram livres"}
        </p>
      </li>
    );
  return <LinhaSlot slot={l} onReservar={onReservar} onAbrirReserva={onAbrirReserva} />;
}
