"use client";

import { Loader2, Search, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatarSP } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { cn } from "@/lib/utils";
import { juntarRepetidos } from "../acoes";
import type { ClienteResumo } from "../consultas";
import type { GrupoRepetido } from "../repetidos";
import { DrawerCliente } from "./drawer-cliente";

export function ListaClientes({
  clientes,
  termoInicial,
  repetidos,
}: {
  clientes: ClienteResumo[];
  termoInicial: string;
  repetidos: GrupoRepetido[];
}) {
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
        {repetidos.length > 0 && !termoInicial && <AvisoRepetidos grupos={repetidos} />}
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

function AvisoRepetidos({ grupos }: { grupos: GrupoRepetido[] }) {
  const [confirmando, setConfirmando] = useState(false);
  const [juntando, startTransition] = useTransition();
  const sobrando = grupos.reduce((soma, g) => soma + g.ids.length - 1, 0);
  const nomes = grupos.map((g) => g.nome);

  function juntar() {
    startTransition(async () => {
      const r = await juntarRepetidos();
      if (!r.ok) return void toast.error(r.erro);
      toast.success(`${r.dados.removidos} ${r.dados.removidos === 1 ? "cadastro repetido juntado" : "cadastros repetidos juntados"}`);
    });
  }

  return (
    <div className="mb-3 rounded-xl border-2 border-amarelo bg-amarelo-fundo p-4 text-amarelo-tinta">
      <p className="flex items-center gap-2 font-bold">
        <Users className="size-5 shrink-0" aria-hidden />
        {grupos.length === 1 ? "1 cliente cadastrado" : `${grupos.length} clientes cadastrados`} mais de uma vez
      </p>
      <p className="mt-1 text-sm">
        {nomes.slice(0, 4).join(", ")}
        {nomes.length > 4 && ` e mais ${nomes.length - 4}`}.
      </p>
      {confirmando ? (
        <>
          <p className="mt-3 text-sm">
            Cada um fica com um cadastro só, com todos os jogos e horários fixos juntos. Sai{sobrando > 1 && "em"}{" "}
            {sobrando} {sobrando === 1 ? "cadastro repetido" : "cadastros repetidos"} da lista.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmando(false)} className="h-11 rounded-full border border-current/30 font-semibold">
              Agora não
            </button>
            <button
              type="button"
              onClick={juntar}
              disabled={juntando}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-foreground font-bold text-background disabled:opacity-50"
            >
              {juntando && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Juntar
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="mt-3 h-11 w-full rounded-full bg-foreground font-bold text-background outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
        >
          Juntar repetidos
        </button>
      )}
    </div>
  );
}
