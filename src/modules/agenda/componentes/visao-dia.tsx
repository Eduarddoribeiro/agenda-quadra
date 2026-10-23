"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  DIAS_SEMANA_CURTOS,
  diaDaSemana,
  formatarData,
  inicioDaSemana,
  nomeDoDia,
  somarDias,
  type DataISO,
} from "@/lib/datas";
import { cn } from "@/lib/utils";
import { textoHorariosLivres } from "../compartilhar";
import type { AgendaDia } from "../consultas";
import { linhasDoDia, slotsLivresFuturos, type Slot } from "../slots";
import { BotaoCompartilhar } from "./botao-compartilhar";
import { DrawerReserva } from "./drawer-reserva";
import { DrawerReservar } from "./drawer-reservar";
import { LinhaSlot } from "./linha-slot";

const hrefDoDia = (data: DataISO, hoje: DataISO) => (data === hoje ? "/" : `/?data=${data}`);

export function VisaoDia({ dia, hoje }: { dia: AgendaDia; hoje: DataISO }) {
  const { data, slots, aberto } = dia;
  const router = useRouter();
  const [trocandoDia, startTroca] = useTransition();
  const [slotReservar, setSlotReservar] = useState<Slot | null>(null);
  const [slotAberto, setSlotAberto] = useState<Slot | null>(null);

  const livres = useMemo(() => slotsLivresFuturos(slots), [slots]);
  const linhas = useMemo(() => linhasDoDia(slots), [slots]);
  const reservados = linhas.filter((s) => s.estado === "reservado").length;
  const texto = useMemo(() => textoHorariosLivres([{ data, slots }]), [data, slots]);

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
  const ehHoje = data === hoje;

  return (
    <div>
      <header className="sticky top-0 z-30 border-b bg-background px-4 pt-4 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-placar text-[3.25rem] leading-[0.85]">{ehHoje ? "Hoje" : nomeDoDia(data)}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {ehHoje ? `${nomeDoDia(data)}, ` : ""}
              {formatarData(data, "d 'de' MMMM")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!ehHoje && (
              <Link
                href="/"
                className="mr-1 flex h-11 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                Hoje
              </Link>
            )}
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

        {/* Faixa da semana: pular direto para outro dia com o polegar */}
        <nav aria-label="Dias da semana" className="mt-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => somarDias(segunda, i)).map((d) => {
            const selecionado = d === data;
            return (
              <Link
                key={d}
                href={hrefDoDia(d, hoje)}
                scroll={false}
                aria-current={selecionado ? "date" : undefined}
                className={cn(
                  "relative flex h-13 flex-col items-center justify-center rounded-lg text-xs leading-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
                  selecionado ? "bg-primary text-primary-foreground" : "text-muted-foreground active:bg-muted",
                  d < hoje && !selecionado && "opacity-55",
                )}
              >
                <span>{DIAS_SEMANA_CURTOS[diaDaSemana(d)]}</span>
                <span className={cn("text-base font-bold", !selecionado && "text-foreground")}>{Number(d.slice(8))}</span>
                {d === hoje && !selecionado && (
                  <span aria-label="hoje" className="absolute bottom-1 size-1 rounded-full bg-agora" />
                )}
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
        className={cn("px-4 pt-4 transition-opacity", trocandoDia && "opacity-50")}
        style={{
          transform: arrasto ? `translateX(${arrasto}px)` : undefined,
          transition: arrasto ? "none" : "transform 200ms ease-out, opacity 150ms",
        }}
      >
        {aberto ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm">
                {livres.length > 0 ? (
                  <>
                    <strong className="text-livre">
                      {livres.length} {livres.length === 1 ? "horário livre" : "horários livres"}
                    </strong>
                    {reservados > 0 && <span className="text-muted-foreground">, {reservados} reservado{reservados > 1 && "s"}</span>}
                  </>
                ) : (
                  <strong>{slots.some((s) => !s.passado) ? "Tudo reservado" : "Dia encerrado"}</strong>
                )}
              </p>
              {livres.length > 0 && <BotaoCompartilhar texto={texto} />}
            </div>

            <ol className="space-y-2.5">
              {linhas.map((slot) => (
                <LinhaSlot key={slot.minuto} slot={slot} onReservar={setSlotReservar} onAbrirReserva={setSlotAberto} />
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
