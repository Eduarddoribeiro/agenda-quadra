"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EstadoLogin } from "./acoes";

// A tela de login é sempre escura (fundo do escudo), independente do tema do celular.
const campoEscuro =
  "h-12 border-white/20 bg-white/8 text-base text-white placeholder:text-white/40 focus-visible:border-white/60 focus-visible:ring-white/25 dark:bg-white/8";

export function FormularioLogin() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-white/80">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={estado.email}
          required
          className={campoEscuro}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="senha" className="text-white/80">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required className={campoEscuro} />
      </div>
      {estado.erro && (
        <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-black outline-none focus-visible:ring-3 focus-visible:ring-white/50 disabled:opacity-50"
      >
        {pendente && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Entrar
      </button>
    </form>
  );
}
