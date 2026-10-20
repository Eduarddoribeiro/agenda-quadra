"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EstadoLogin } from "./acoes";

export function FormularioLogin() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={estado.email} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      {estado.erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-50"
      >
        {pendente && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Entrar
      </button>
    </form>
  );
}
