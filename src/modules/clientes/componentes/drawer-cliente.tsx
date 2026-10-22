"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatarTelefone } from "@/lib/telefone";
import { atualizarCliente, criarCliente, excluirCliente } from "../acoes";

type ClienteEditavel = { id: string; nome: string; telefone: string | null; observacoes: string | null };
/** O que some junto ao excluir: aparece na confirmação. */
type Vinculos = { jogos: number; fixos: number };

/** Cadastro (sem `cliente`) ou edição de cliente num bottom sheet. */
export function DrawerCliente({
  aberto,
  onFechar,
  cliente,
  vinculos,
}: {
  aberto: boolean;
  onFechar: () => void;
  cliente?: ClienteEditavel;
  vinculos?: Vinculos;
}) {
  return (
    <Drawer open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DrawerContent className="pb-seguro">
        {aberto && <Formulario cliente={cliente} vinculos={vinculos} onFechar={onFechar} />}
      </DrawerContent>
    </Drawer>
  );
}

function Formulario({
  cliente,
  vinculos,
  onFechar,
}: {
  cliente?: ClienteEditavel;
  vinculos?: Vinculos;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [telefone, setTelefone] = useState(formatarTelefone(cliente?.telefone));
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? "");
  const [salvando, startTransition] = useTransition();
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  function excluir() {
    if (!cliente) return;
    startTransition(async () => {
      const r = await excluirCliente(cliente.id);
      if (!r.ok) return void toast.error(r.erro);
      toast.success(`${cliente.nome} excluído`);
      onFechar();
      router.replace("/clientes");
    });
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const dados = { nome, telefone, observacoes };
      if (cliente) {
        const r = await atualizarCliente(cliente.id, dados);
        if (!r.ok) return void toast.error(r.erro);
        toast.success("Cliente atualizado");
        onFechar();
      } else {
        const r = await criarCliente(dados);
        if (!r.ok) return void toast.error(r.erro);
        toast.success(`${nome.trim()} cadastrado`);
        onFechar();
        router.push(`/clientes/${r.dados.id}`);
      }
    });
  }

  return (
    <form onSubmit={salvar} className="flex max-h-full min-h-0 flex-col">
      <header className="px-5 pt-5 pb-3">
        <DrawerTitle className="text-2xl font-extrabold">{cliente ? "Editar cliente" : "Novo cliente"}</DrawerTitle>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        <div className="space-y-1.5">
          <Label htmlFor="cliente-nome">Nome</Label>
          <Input
            id="cliente-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoCapitalize="words"
            autoComplete="off"
            autoFocus={!cliente}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cliente-telefone">WhatsApp</Label>
          <Input
            id="cliente-telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            inputMode="tel"
            autoComplete="off"
            placeholder="(47) 99999-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cliente-obs">
            Observações <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="cliente-obs"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex.: time da empresa, prefere horário das 19h"
            rows={2}
          />
        </div>
      </div>
      <footer className="border-t px-5 pt-3 pb-4">
        <button
          type="submit"
          disabled={salvando || nome.trim().length < 2}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-40"
        >
          {salvando && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {cliente ? "Salvar alterações" : "Cadastrar cliente"}
        </button>
        {cliente && !confirmandoExclusao && (
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            className="mt-1 h-11 w-full rounded-full text-sm font-semibold text-destructive outline-none focus-visible:ring-3 focus-visible:ring-destructive/40"
          >
            Excluir cliente
          </button>
        )}
        {cliente && confirmandoExclusao && (
          <div className="mt-3 rounded-xl border-2 border-destructive/40 p-4">
            <p className="font-bold">Excluir {cliente.nome}?</p>
            <p className="mt-1 text-sm text-muted-foreground">{avisoExclusao(vinculos)}</p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={excluir}
                disabled={salvando}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-destructive font-bold text-white disabled:opacity-50"
              >
                {salvando && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Excluir de vez
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="h-11 rounded-full text-sm font-semibold text-muted-foreground"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </footer>
    </form>
  );
}

function avisoExclusao(vinculos?: Vinculos) {
  const { jogos = 0, fixos = 0 } = vinculos ?? {};
  if (!jogos && !fixos) return "Ele não tem nenhum jogo marcado nem histórico. Não dá para desfazer.";
  const partes = [
    // O histórico da ficha vem limitado a 100.
    jogos && `${jogos === 1 ? "1 jogo" : jogos >= 100 ? "100 ou mais jogos" : `${jogos} jogos`} (marcados e histórico)`,
    fixos && (fixos === 1 ? "o horário fixo" : `os ${fixos} horários fixos`),
  ].filter(Boolean);
  return `Também apaga ${partes.join(" e ")} dele. Não dá para desfazer.`;
}
