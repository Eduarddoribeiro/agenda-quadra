"use client";

import { Plus } from "lucide-react";
import { IconeWhatsApp } from "@/components/icone-whatsapp";
import { NumeralHorario } from "@/components/numeral-horario";
import { minutoSP, rotuloHorario } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { formatarTelefone, linkWhatsApp } from "@/lib/telefone";
import type { Slot } from "../slots";

type Props = {
  slot: Slot;
  onReservar: (slot: Slot) => void;
  onAbrirReserva: (slot: Slot) => void;
};

function Hora({ slot }: { slot: Slot }) {
  return (
    <div className="pt-1.5">
      <NumeralHorario
        // Jogo fora da grade (ex.: 14h30 numa grade de horas cheias) mostra o horário dele.
        minuto={slot.reserva ? minutoSP(slot.reserva.inicio) : slot.minuto}
        className={cn(
          "text-[2.25rem]",
          slot.agora ? "text-agora" : slot.passado ? "text-muted-foreground" : "text-foreground",
        )}
      />
    </div>
  );
}

/** Selo dos horários fixos: quem joga toda semana não precisa de confirmação. */
function SeloFixo() {
  return (
    <span className="shrink-0 rounded-full border px-1.5 py-px text-[10px] leading-none font-bold tracking-wide text-muted-foreground uppercase">
      Fixo
    </span>
  );
}

export function LinhaSlot({ slot, onReservar, onAbrirReserva }: Props) {
  const fimHora = rotuloHorario(slot.minuto + 60);
  const r = slot.reserva;
  const fimDoJogo = r ? rotuloHorario(minutoSP(r.fim) || 1440) : fimHora;
  // Só aparece quando o jogo não é a 1h do slot (ex.: "14h30 às 16h").
  const horarioDiferente =
    r && (r.inicio.getTime() !== slot.inicio.getTime() || r.fim.getTime() !== slot.fim.getTime())
      ? `${rotuloHorario(minutoSP(r.inicio))} às ${fimDoJogo}`
      : null;
  const emJogo = slot.agora && slot.estado === "reservado";

  return (
    <li className="relative grid grid-cols-[3.5rem_1fr] gap-2">
      {slot.agora && (
        <div aria-hidden className="absolute -top-1.5 right-0 left-0 flex items-center gap-2">
          <span className="h-0.5 flex-1 bg-agora" />
          <span className="text-xs font-bold text-agora">agora</span>
        </div>
      )}

      <Hora slot={slot} />

      {slot.estado === "livre" &&
        (slot.passado ? (
          <div className="flex min-h-11 items-center rounded-xl border border-dashed px-4 text-sm text-muted-foreground">
            Ficou livre
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onReservar(slot)}
            className="group flex min-h-13 items-center justify-between gap-2 rounded-xl bg-livre-fundo pr-1.5 pl-4 text-left text-livre-tinta outline-none transition-transform active:scale-[0.985] focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <span>
              <span className="text-base font-bold">Livre</span>
              <span className="ml-1.5 text-xs opacity-80">até {fimHora}</span>
            </span>
            {/* A linha inteira reserva; o "+" só mostra o gesto, sem repetir "Reservar" em cada hora livre. */}
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-livre text-sobre-verde">
              <Plus className="size-6" strokeWidth={2.75} aria-hidden />
              <span className="sr-only">Reservar</span>
            </span>
          </button>
        ))}

      {slot.estado === "reservado" && r && (
        <div
          className={cn(
            "flex min-h-13 items-stretch overflow-hidden rounded-xl border bg-card",
            emJogo && "border-agora/70",
            slot.passado && "opacity-60",
          )}
        >
          <button
            type="button"
            onClick={() => onAbrirReserva(slot)}
            className="min-w-0 flex-1 py-2 pr-2 pl-4 text-left outline-none focus-visible:bg-muted"
          >
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold">{r.clienteNome}</span>
              {r.fixaId && <SeloFixo />}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {emJogo && <strong className="font-bold text-agora">Em jogo até {fimDoJogo} · </strong>}
              {!emJogo && horarioDiferente && <strong className="font-semibold text-foreground">{horarioDiferente} · </strong>}
              {r.observacoes || formatarTelefone(r.clienteTelefone) || "Sem telefone"}
            </span>
          </button>
          {r.clienteTelefone && (
            <a
              href={linkWhatsApp(r.clienteTelefone)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Conversar com ${r.clienteNome} no WhatsApp`}
              className="grid w-13 shrink-0 place-items-center border-l text-foreground outline-none focus-visible:bg-muted active:bg-muted"
            >
              <IconeWhatsApp className="size-[22px]" />
            </a>
          )}
        </div>
      )}

      {slot.estado === "bloqueado" && (
        <div
          className={cn(
            "flex min-h-13 items-center gap-3 rounded-xl bg-amarelo-fundo px-4 text-amarelo-tinta",
            slot.passado && "opacity-60",
          )}
        >
          {/* Cartão amarelo */}
          <span aria-hidden className="h-6 w-4 shrink-0 -rotate-12 rounded-[3px] bg-amarelo shadow-sm" />
          <span className="min-w-0">
            <span className="block text-sm font-bold">Bloqueado</span>
            <span className="block truncate text-xs">{slot.bloqueio?.motivo}</span>
          </span>
        </div>
      )}
    </li>
  );
}
