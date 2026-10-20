"use client";

import { Check, Loader2, Search, UserPlus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarData, horaCurta, nomeDoDia, type DataISO } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { cn } from "@/lib/utils";
import { pesquisarClientes } from "@/modules/clientes/acoes";
import type { ClienteResumo } from "@/modules/clientes/consultas";
import { criarReserva } from "../acoes";
import type { Slot } from "../slots";

type Props = {
  data: DataISO;
  slot: Slot | null;
  onFechar: () => void;
};

export function DrawerReservar({ data, slot, onFechar }: Props) {
  return (
    <Drawer open={slot !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DrawerContent className="pb-seguro">
        {/* A key zera o formulário a cada slot aberto */}
        {slot && <FormularioReserva key={slot.inicio.toISOString()} data={data} slot={slot} onFechar={onFechar} />}
      </DrawerContent>
    </Drawer>
  );
}

function FormularioReserva({ data, slot, onFechar }: { data: DataISO; slot: Slot; onFechar: () => void }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ClienteResumo[] | null>(null);
  const [selecionado, setSelecionado] = useState<ClienteResumo | null>(null);
  const [cadastrando, setCadastrando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [buscando, startBusca] = useTransition();
  const [salvando, startSalvar] = useTransition();

  // Busca com pequeno atraso enquanto digita; sem termo, mostra os clientes que mais jogam.
  useEffect(() => {
    if (selecionado || cadastrando) return;
    const id = setTimeout(() => {
      startBusca(async () => setResultados(await pesquisarClientes(termo)));
    }, termo ? 250 : 0);
    return () => clearTimeout(id);
  }, [termo, selecionado, cadastrando]);

  const podeConfirmar = selecionado !== null || (cadastrando && novoNome.trim().length >= 2);

  function comecarCadastro() {
    const soDigitos = termo.replace(/\D/g, "");
    // Se digitou um telefone na busca, ele vai para o campo certo.
    if (soDigitos.length >= 8 && soDigitos.length === termo.replace(/[\s()+-]/g, "").length) {
      setNovoTelefone(termo);
      setNovoNome("");
    } else {
      setNovoNome(termo);
    }
    setCadastrando(true);
  }

  function confirmar() {
    startSalvar(async () => {
      const resultado = await criarReserva({
        data,
        hora: slot.hora,
        clienteId: selecionado?.id,
        novoCliente: cadastrando ? { nome: novoNome, telefone: novoTelefone } : undefined,
        observacoes,
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      const nome = selecionado?.nome ?? novoNome.trim();
      toast.success(`Reservado: ${nome}, ${horaCurta(slot.hora)}`);
      onFechar();
    });
  }

  return (
    <div className="flex max-h-full min-h-0 flex-col">
      <header className="px-5 pt-5 pb-3">
        <DrawerTitle className="font-placar text-[2rem] leading-none">
          {horaCurta(slot.hora)} às {horaCurta(slot.hora + 1)}
        </DrawerTitle>
        <DrawerDescription className="mt-1 text-sm">
          {nomeDoDia(data)}, {formatarData(data, "d 'de' MMMM")}
        </DrawerDescription>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
        {selecionado ? (
          <div className="flex items-center gap-3 rounded-xl border-2 border-livre bg-livre-fundo px-4 py-3 text-livre-tinta">
            <Check className="size-5 shrink-0" strokeWidth={3} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{selecionado.nome}</p>
              {selecionado.telefone && <p className="text-xs">{formatarTelefone(selecionado.telefone)}</p>}
            </div>
            <button
              type="button"
              onClick={() => setSelecionado(null)}
              className="h-10 rounded-full px-3 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Trocar
            </button>
          </div>
        ) : cadastrando ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">Novo cliente</p>
              <button
                type="button"
                onClick={() => setCadastrando(false)}
                className="flex h-9 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground"
              >
                <X className="size-4" aria-hidden />
                Buscar existente
              </button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novo-nome">Nome</Label>
              <Input
                id="novo-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                autoComplete="off"
                autoCapitalize="words"
                autoFocus={!novoNome}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novo-telefone">WhatsApp</Label>
              <Input
                id="novo-telefone"
                value={novoTelefone}
                onChange={(e) => setNovoTelefone(e.target.value)}
                inputMode="tel"
                autoComplete="off"
                placeholder="(47) 99999-0000"
                autoFocus={Boolean(novoNome)}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Nome ou telefone do cliente"
                aria-label="Buscar cliente"
                autoComplete="off"
                className="pl-10"
              />
              {buscando && (
                <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
              )}
            </div>

            <ul className="mt-2 divide-y" aria-label={termo ? "Clientes encontrados" : "Clientes frequentes"}>
              {!termo && resultados && resultados.length > 0 && (
                <li className="pt-2 pb-1 text-xs text-muted-foreground">Frequentes</li>
              )}
              {resultados?.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionado(c)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left outline-none focus-visible:bg-muted active:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.nome}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatarTelefone(c.telefone) || "Sem telefone"}
                      </span>
                    </span>
                    {c.totalReservas > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.totalReservas} {c.totalReservas === 1 ? "jogo" : "jogos"}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={comecarCadastro}
              className="mt-2 flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 text-left font-semibold outline-none focus-visible:border-ring"
            >
              <UserPlus className="size-5 shrink-0" aria-hidden />
              <span className="truncate">{termo.trim() ? `Cadastrar “${termo.trim()}”` : "Cadastrar cliente novo"}</span>
            </button>
          </div>
        )}

        {(selecionado || cadastrando) && (
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="obs-reserva">
              Observação <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="obs-reserva"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: traz a própria bola"
              autoComplete="off"
            />
          </div>
        )}
      </div>

      <footer className="border-t px-5 pt-3 pb-4">
        <button
          type="button"
          onClick={confirmar}
          disabled={!podeConfirmar || salvando}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-full bg-livre text-base font-bold text-white outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-40 dark:text-[#06210f]",
          )}
        >
          {salvando && <Loader2 className="size-5 animate-spin" aria-hidden />}
          Confirmar reserva
        </button>
      </footer>
    </div>
  );
}
