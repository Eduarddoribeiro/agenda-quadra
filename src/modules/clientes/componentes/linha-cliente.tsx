"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { formatarSP } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { cn } from "@/lib/utils";
import type { ClienteResumo } from "../consultas";

/** Largura do botão vermelho que aparece ao deslizar. */
const LARGURA = 88;

/**
 * Cliente da lista. Deslizar para a esquerda mostra o lixo; tocar nele chama `onApagar`.
 * Só um aberto por vez: quem controla é a lista (`aberto` / `onAbrir`).
 */
export function LinhaCliente({
  cliente: c,
  aberto,
  onAbrir,
  onApagar,
}: {
  cliente: ClienteResumo;
  aberto: boolean;
  onAbrir: (aberto: boolean) => void;
  onApagar: () => void;
}) {
  const [arraste, setArraste] = useState<number | null>(null);
  const toque = useRef<{ x: number; y: number; base: number; direcao?: "x" | "y" } | null>(null);
  const moveu = useRef(false);
  const deslocamento = arraste ?? (aberto ? -LARGURA : 0);

  function inicio(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    toque.current = { x: e.clientX, y: e.clientY, base: aberto ? -LARGURA : 0 };
    moveu.current = false;
  }

  function mover(e: React.PointerEvent) {
    const t = toque.current;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (!t.direcao) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // Movimento mais vertical é rolagem da lista: deixa o navegador cuidar.
      t.direcao = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (t.direcao === "y") return void (toque.current = null);
      e.currentTarget.setPointerCapture(e.pointerId);
      moveu.current = true;
    }
    setArraste(Math.min(0, Math.max(-LARGURA * 1.4, t.base + dx)));
  }

  function fim() {
    if (toque.current?.direcao === "x" && arraste !== null) onAbrir(arraste < -LARGURA / 2);
    toque.current = null;
    setArraste(null);
  }

  return (
    <li className="relative overflow-hidden">
      <button
        type="button"
        onClick={onApagar}
        tabIndex={aberto ? 0 : -1}
        aria-hidden={!aberto}
        aria-label={`Apagar ${c.nome}`}
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 bg-destructive text-xs font-bold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-inset",
          deslocamento === 0 && "invisible",
        )}
        style={{ width: Math.max(LARGURA, -deslocamento) }}
      >
        <Trash2 className="size-5" aria-hidden />
        Apagar
      </button>
      <Link
        href={`/clientes/${c.id}`}
        draggable={false}
        onPointerDown={inicio}
        onPointerMove={mover}
        onPointerUp={fim}
        onPointerCancel={fim}
        onClick={(e) => {
          // Fim de um arraste, ou toque na linha aberta: só fecha, não abre a ficha.
          if (moveu.current || aberto) {
            e.preventDefault();
            if (!moveu.current) onAbrir(false);
          }
          moveu.current = false;
        }}
        style={{ transform: `translateX(${deslocamento}px)` }}
        className={cn(
          "relative flex min-h-16 touch-pan-y items-center justify-between gap-3 bg-card px-4 py-2.5 outline-none select-none focus-visible:bg-muted active:bg-muted",
          arraste === null && "transition-transform duration-200 ease-out",
        )}
      >
        <span className="min-w-0">
          <span className="block truncate font-bold">{c.nome}</span>
          <span className="block text-xs text-muted-foreground">{formatarTelefone(c.telefone) || "Sem telefone"}</span>
        </span>
        <span className="shrink-0 text-right text-xs leading-tight text-muted-foreground">
          <span className="block">
            <strong className="text-sm text-foreground">{c.totalReservas}</strong> {c.totalReservas === 1 ? "jogo" : "jogos"}
          </span>
          {c.ultimaReserva && <span className="block">{formatarSP(c.ultimaReserva, "dd/MM")}</span>}
        </span>
      </Link>
    </li>
  );
}
