"use client";

import { Plus, Repeat } from "lucide-react";
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
    <div className="pt-2">
      <NumeralHorario
        // Jogo fora da grade (ex.: 14h30 numa grade de horas cheias) mostra o horário dele.
        minuto={slot.reserva ? minutoSP(slot.reserva.inicio) : slot.minuto}
        className={cn(
          "text-[2.75rem]",
          slot.agora ? "text-agora" : slot.passado ? "text-muted-foreground/60" : "text-foreground",
        )}
      />
    </div>
  );
}

export function LinhaSlot({ slot, onReservar, onAbrirReserva }: Props) {
  const fimHora = rotuloHorario(slot.minuto + 60);
  const r = slot.reserva;
  // Só aparece quando o jogo não é a 1h do slot (ex.: "14h30 às 16h").
  const horarioDiferente =
    r && (r.inicio.getTime() !== slot.inicio.getTime() || r.fim.getTime() !== slot.fim.getTime())
      ? `${rotuloHorario(minutoSP(r.inicio))} às ${rotuloHorario(minutoSP(r.fim) || 1440)}`
      : null;

  return (
    <li className="relative grid grid-cols-[4.25rem_1fr] gap-2">
      {slot.agora && (
        <div aria-hidden className="absolute -top-1.5 right-0 left-0 flex items-center gap-2">
          <span className="h-0.5 flex-1 bg-agora" />
          <span className="text-[11px] font-bold text-agora">agora</span>
        </div>
      )}

      <Hora slot={slot} />

      {slot.estado === "livre" &&
        (slot.passado ? (
          <div className="flex min-h-16 items-center rounded-xl border border-dashed px-4 text-sm text-muted-foreground">
            Ficou livre
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onReservar(slot)}
            className="group flex min-h-16 items-center justify-between rounded-xl bg-livre-fundo pr-2 pl-4 text-left text-livre-tinta outline-none transition-transform active:scale-[0.985] focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <span>
              <span className="block text-base font-bold">Livre</span>
              <span className="block text-xs opacity-80">
                até {fimHora}
              </span>
            </span>
            <span className="flex h-12 items-center gap-1.5 rounded-full bg-livre px-5 text-[15px] font-bold text-white dark:text-[#06210f]">
              <Plus className="size-5" strokeWidth={2.75} aria-hidden />
              Reservar
            </span>
          </button>
        ))}

      {slot.estado === "reservado" && slot.reserva && (
        <div
          className={cn(
            "flex min-h-16 items-stretch overflow-hidden rounded-xl border bg-card",
            slot.passado && "opacity-60",
          )}
        >
          <button
            type="button"
            onClick={() => onAbrirReserva(slot)}
            className="min-w-0 flex-1 border-l-4 border-l-foreground py-2.5 pr-2 pl-3 text-left outline-none focus-visible:bg-muted"
          >
            <span className="flex items-center gap-1.5">
              {slot.reserva.fixaId && <Repeat className="size-4 shrink-0" aria-label="Horário fixo" />}
              <span className="truncate text-base font-bold">{slot.reserva.clienteNome}</span>
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {horarioDiferente && <strong className="font-semibold text-foreground">{horarioDiferente} · </strong>}
              {slot.reserva.observacoes || formatarTelefone(slot.reserva.clienteTelefone) || "Sem telefone"}
            </span>
          </button>
          {slot.reserva.clienteTelefone && (
            <a
              href={linkWhatsApp(slot.reserva.clienteTelefone)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Conversar com ${slot.reserva.clienteNome} no WhatsApp`}
              className="grid w-14 shrink-0 place-items-center border-l text-whatsapp outline-none focus-visible:bg-muted active:bg-muted"
            >
              <IconeWhatsApp className="size-6" />
            </a>
          )}
        </div>
      )}

      {slot.estado === "bloqueado" && (
        <div
          className={cn(
            "flex min-h-16 items-center gap-3 rounded-xl bg-amarelo-fundo px-4 text-amarelo-tinta",
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
