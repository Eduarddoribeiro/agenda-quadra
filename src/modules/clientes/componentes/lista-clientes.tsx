"use client";

import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { formatarSP } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { cn } from "@/lib/utils";
import type { ClienteResumo } from "../consultas";
import { DrawerCliente } from "./drawer-cliente";

export function ListaClientes({ clientes, termoInicial }: { clientes: ClienteResumo[]; termoInicial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [termo, setTermo] = useState(termoInicial);
  const [novoAberto, setNovoAberto] = useState(false);
  const [buscando, startTransition] = useTransition();

  // A busca fica na URL (?q=), assim voltar da ficha do cliente mantém o filtro.
  useEffect(() => {
    if (termo === termoInicial) return;
    const id = setTimeout(() => {
      startTransition(() => router.replace(termo ? `${pathname}?q=${encodeURIComponent(termo)}` : pathname, { scroll: false }));
    }, 250);
    return () => clearTimeout(id);
  }, [termo, termoInicial, pathname, router]);

  return (
    <div>
      <header className="sticky top-0 z-30 border-b bg-background px-4 pt-4 pb-3">
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-placar text-[3.25rem] leading-[0.85]">Clientes</h1>
          <button
            type="button"
            onClick={() => setNovoAberto(true)}
            className="flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <UserPlus className="size-4" aria-hidden />
            Novo
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            aria-label="Buscar cliente"
            className="pl-10"
          />
        </div>
      </header>

      <div className={cn("px-4 pt-3 transition-opacity", buscando && "opacity-60")}>
        {clientes.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed px-6 py-10 text-center">
            {termoInicial ? (
              <>
                <p className="text-lg font-bold">Ninguém encontrado para “{termoInicial}”</p>
                <p className="mt-1 text-sm text-muted-foreground">Confira a grafia ou cadastre como cliente novo.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold">Nenhum cliente ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os clientes aparecem aqui quando você faz uma reserva ou cadastra alguém.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={() => setNovoAberto(true)}
              className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              Cadastrar cliente
            </button>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {clientes.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5 outline-none focus-visible:bg-muted active:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{c.nome}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatarTelefone(c.telefone) || "Sem telefone"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs leading-tight text-muted-foreground">
                    <span className="block">
                      <strong className="text-sm text-foreground">{c.totalReservas}</strong>{" "}
                      {c.totalReservas === 1 ? "jogo" : "jogos"}
                    </span>
                    {c.ultimaReserva && <span className="block">{formatarSP(c.ultimaReserva, "dd/MM")}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DrawerCliente aberto={novoAberto} onFechar={() => setNovoAberto(false)} />
    </div>
  );
}
