"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hojeSP } from "@/lib/datas";

/** Ficou mais que isso em segundo plano: recarrega a página inteira (pega também a versão nova do app). */
const LONGE_MS = 10 * 60 * 1000;

/**
 * O app instalado fica dias suspenso no celular. Ao voltar para ele, a tela era a da última vez
 * (ex.: a agenda de segunda aparecendo no sábado) e, depois de um deploy, podia nem abrir.
 * Ao voltar: se virou o dia ou passou muito tempo, recarrega tudo; senão, só busca os dados de novo.
 */
export function AtualizarAoVoltar() {
  const router = useRouter();

  useEffect(() => {
    let diaDaTela = hojeSP();
    let saiuEm = 0;

    function voltou() {
      const longe = saiuEm > 0 && Date.now() - saiuEm > LONGE_MS;
      if (longe || hojeSP() !== diaDaTela) return window.location.reload();
      if (saiuEm > 0) router.refresh();
      diaDaTela = hojeSP();
    }

    function visibilidade() {
      if (document.visibilityState === "hidden") saiuEm = Date.now();
      else voltou();
    }

    // Página restaurada do cache de voltar/avançar do navegador: sempre está velha.
    function restaurada(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }

    document.addEventListener("visibilitychange", visibilidade);
    window.addEventListener("pageshow", restaurada);
    return () => {
      document.removeEventListener("visibilitychange", visibilidade);
      window.removeEventListener("pageshow", restaurada);
    };
  }, [router]);

  return null;
}
