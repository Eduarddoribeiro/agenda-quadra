"use client";

import { ChevronLeft, Pencil, Phone, Repeat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { IconeWhatsApp } from "@/components/icone-whatsapp";
import { NumeralHorario } from "@/components/numeral-horario";
import { dataSP, formatarSP, minutoSP, nomeDoDia } from "@/lib/datas";
import { formatarTelefone, linkWhatsApp } from "@/lib/telefone";
import { cn } from "@/lib/utils";
import { DrawerCliente } from "./drawer-cliente";

type Cliente = { id: string; nome: string; telefone: string | null; observacoes: string | null; createdAt: Date };
type ItemHistorico = {
  id: string;
  inicio: Date;
  fim: Date;
  status: "confirmada" | "cancelada";
  observacoes: string | null;
  fixaId: string | null;
};

const PROXIMOS_VISIVEIS = 4;

function LinhaHistorico({ item }: { item: ItemHistorico }) {
  const data = dataSP(item.inicio);
  const cancelada = item.status === "cancelada";
  return (
    <li>
      <Link
        href={`/?data=${data}`}
        className="grid min-h-15 grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-2 outline-none focus-visible:bg-muted active:bg-muted"
      >
        <NumeralHorario
          minuto={minutoSP(item.inicio)}
          className={cn("text-[2rem]", cancelada && "text-muted-foreground line-through")}
        />
        <span className="min-w-0">
          <span className={cn("flex items-center gap-1.5 font-semibold", cancelada && "text-muted-foreground")}>
            {nomeDoDia(data)}, {formatarSP(item.inicio, "dd/MM/yy")}
            {item.fixaId && <Repeat className="size-3.5 text-muted-foreground" aria-label="Horário fixo" />}
          </span>
          {item.observacoes && <span className="block truncate text-xs text-muted-foreground">{item.observacoes}</span>}
        </span>
        {cancelada && <span className="text-xs font-semibold text-destructive">Cancelada</span>}
      </Link>
    </li>
  );
}

export function FichaCliente({
  cliente,
  historico,
  fixos,
  agora,
}: {
  cliente: Cliente;
  historico: ItemHistorico[];
  /** Ex.: "toda quarta às 18h30" */
  fixos: string[];
  agora: Date;
}) {
  const [editando, setEditando] = useState(false);
  const [verTodos, setVerTodos] = useState(false);

  // Próximos = jogos marcados que ainda vão acontecer; o resto (inclusive cancelados) é histórico.
  const marcado = (h: ItemHistorico) => h.status === "confirmada" && h.fim > agora;
  const proximos = historico.filter(marcado).reverse();
  const anteriores = historico.filter((h) => !marcado(h));
  const jogados = anteriores.filter((h) => h.status === "confirmada").length;
  const cancelados = historico.filter((h) => h.status === "cancelada").length;

  return (
    <div>
      <header className="px-4 pt-3">
        <Link
          href="/clientes"
          className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1 text-sm font-semibold text-muted-foreground"
        >
          <ChevronLeft className="size-5" aria-hidden />
          Clientes
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.75rem] leading-tight font-extrabold text-balance">{cliente.nome}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatarTelefone(cliente.telefone) || "Sem telefone"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label="Editar cliente"
            className="grid size-11 shrink-0 place-items-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        </div>

        {cliente.telefone && (
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <a
              href={linkWhatsApp(cliente.telefone)}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp font-bold text-sobre-verde"
            >
              <IconeWhatsApp className="size-5" />
              Conversar no WhatsApp
            </a>
            <a
              href={`tel:+${cliente.telefone}`}
              aria-label="Ligar"
              className="grid size-12 place-items-center rounded-full border-2"
            >
              <Phone className="size-5" aria-hidden />
            </a>
          </div>
        )}

        {cliente.observacoes && (
          <p className="mt-4 rounded-xl bg-card px-4 py-3 text-sm whitespace-pre-line">{cliente.observacoes}</p>
        )}

        {/* Placar do cliente */}
        <dl className="mt-5 grid grid-cols-3 divide-x rounded-xl border bg-card text-center">
          <div className="py-3">
            <dt className="text-xs text-muted-foreground">Jogou</dt>
            <dd className="font-placar mt-1 text-[2rem]">{jogados}</dd>
          </div>
          <div className="py-3">
            <dt className="text-xs text-muted-foreground">Marcados</dt>
            <dd className="font-placar mt-1 text-[2rem] text-livre">{proximos.length}</dd>
          </div>
          <div className="py-3">
            <dt className="text-xs text-muted-foreground">Cancelou</dt>
            <dd className="font-placar mt-1 text-[2rem]">{cancelados}</dd>
          </div>
        </dl>
      </header>

      {fixos.length > 0 && (
        <section className="mt-6 px-4" aria-labelledby="titulo-fixos">
          <h2 id="titulo-fixos" className="mb-2 font-bold">Horário fixo</h2>
          <ul className="space-y-2">
            {fixos.map((f) => (
              <li key={f} className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
                <Repeat className="size-5 shrink-0" aria-hidden />
                <span className="font-semibold first-letter:uppercase">{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Para encerrar, abra um jogo dele na agenda e toque em cancelar.
          </p>
        </section>
      )}

      <section className="mt-6 px-4" aria-labelledby="titulo-proximos">
        <h2 id="titulo-proximos" className="mb-2 font-bold">Próximos jogos</h2>
        {proximos.length ? (
          <>
            <ul className="divide-y rounded-xl border bg-card">
              {(verTodos ? proximos : proximos.slice(0, PROXIMOS_VISIVEIS)).map((h) => (
                <LinhaHistorico key={h.id} item={h} />
              ))}
            </ul>
            {!verTodos && proximos.length > PROXIMOS_VISIVEIS && (
              <button
                type="button"
                onClick={() => setVerTodos(true)}
                className="mt-1 h-11 w-full rounded-full text-sm font-semibold text-muted-foreground active:bg-muted"
              >
                Ver mais {proximos.length - PROXIMOS_VISIVEIS} {proximos.length - PROXIMOS_VISIVEIS === 1 ? "jogo" : "jogos"}
              </button>
            )}
          </>
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
            Nenhum jogo marcado. Para reservar, toque num horário livre na tela Hoje.
          </p>
        )}
      </section>

      {anteriores.length > 0 && (
        <section className="mt-6 px-4" aria-labelledby="titulo-anteriores">
          <h2 id="titulo-anteriores" className="mb-2 font-bold">Histórico</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {anteriores.map((h) => <LinhaHistorico key={h.id} item={h} />)}
          </ul>
        </section>
      )}

      <p className="mt-6 px-4 text-xs text-muted-foreground">
        Cliente desde {formatarSP(cliente.createdAt, "MMMM 'de' yyyy")}
      </p>

      <DrawerCliente
        aberto={editando}
        onFechar={() => setEditando(false)}
        cliente={cliente}
        vinculos={{ jogos: historico.length, fixos: fixos.length }}
      />
    </div>
  );
}
