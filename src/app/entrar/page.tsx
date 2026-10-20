import type { Metadata } from "next";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <main className="pt-seguro mx-auto flex min-h-dvh max-w-md flex-col px-6">
      {/* Meia quadra vista de cima: linha de fundo, área e meio-campo */}
      <div aria-hidden className="relative mt-10 h-40 overflow-hidden rounded-2xl bg-livre">
        <div className="absolute inset-3 rounded-lg border-2 border-white/70" />
        <div className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
        <div className="absolute top-3 bottom-3 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
        <div className="absolute top-1/2 left-3 h-20 w-10 -translate-y-1/2 rounded-r-full border-2 border-l-0 border-white/70" />
        <div className="absolute top-1/2 right-3 h-20 w-10 -translate-y-1/2 rounded-l-full border-2 border-r-0 border-white/70" />
        <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>

      <h1 className="font-placar mt-8 text-[3.5rem] leading-[0.85]">Agenda da quadra</h1>
      <p className="mt-3 text-muted-foreground">Entre para ver os horários e marcar jogos.</p>

      <div className="mt-8">
        <FormularioLogin />
      </div>

      <p className="mt-auto py-8 text-center text-xs text-muted-foreground">
        Esqueceu a senha? Peça para o dono redefinir no painel do Supabase.
      </p>
    </main>
  );
}
