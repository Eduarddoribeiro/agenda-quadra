"use client";

import { RotateCw } from "lucide-react";

/** Algo quebrou na tela (ex.: o app ficou aberto de uma versão antiga). Recarregar resolve quase sempre. */
export default function ErroDaTela() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="titulo-tela font-placar text-[2.5rem] leading-none">Não abriu</h1>
      <p className="text-muted-foreground">Toque para carregar a agenda de novo.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex h-14 items-center gap-2 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
      >
        <RotateCw className="size-5" aria-hidden />
        Recarregar
      </button>
    </div>
  );
}
