"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { linkWhatsApp } from "@/lib/telefone";
import { cn } from "@/lib/utils";

/**
 * Compartilha os horários livres. No celular abre a folha de compartilhamento do sistema
 * (WhatsApp, grupos etc.); sem ela, abre o WhatsApp direto com o texto pronto.
 */
export function BotaoCompartilhar({ texto, className, rotulo = "Compartilhar livres" }: {
  texto: string | null;
  className?: string;
  rotulo?: string;
}) {
  async function compartilhar() {
    if (!texto) {
      toast("Nenhum horário livre para compartilhar.");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ text: texto });
        return;
      } catch (erro) {
        if ((erro as Error).name === "AbortError") return;
      }
    }
    window.open(linkWhatsApp(null, texto), "_blank", "noopener");
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-foreground px-4 text-sm font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted",
        className,
      )}
    >
      <Share2 className="size-4" aria-hidden />
      {rotulo}
    </button>
  );
}
