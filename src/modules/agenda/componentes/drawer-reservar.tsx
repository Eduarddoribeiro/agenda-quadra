"use client";

import { Check, Clock, Loader2, Repeat, Search, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { diaDaSemana, formatarData, minutosDoHorario, nomeDoDia, rotuloHorario } from "@/lib/datas";
import { formatarTelefone } from "@/lib/telefone";
import { cn } from "@/lib/utils";
import { pesquisarClientes } from "@/modules/clientes/acoes";
import type { ClienteResumo } from "@/modules/clientes/consultas";
import { chaveDoNome } from "@/modules/clientes/nomes";
import { criarReserva } from "../acoes";
import type { AgendaDia } from "../consultas";
import { rotuloFixo } from "../recorrencia";
import { conflitoNoIntervalo, DURACAO_SLOT, instanteDoMinuto, type Slot } from "../slots";

type Props = {
  dia: AgendaDia;
  slot: Slot | null;
  onFechar: () => void;
};

export function DrawerReservar({ dia, slot, onFechar }: Props) {
  return (
    <Drawer open={slot !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DrawerContent className="pb-seguro">
        {/* A key zera o formulário a cada slot aberto */}
        {slot && <FormularioReserva key={slot.inicio.toISOString()} dia={dia} slot={slot} onFechar={onFechar} />}
      </DrawerContent>
    </Drawer>
  );
}

/** Período de funcionamento que contém o slot, em minutos do dia. */
function periodoDoSlot(dia: AgendaDia, slot: Slot): { abertura: number; fechamento: number } {
  const periodo = dia.periodos
    .map((p) => ({ abertura: minutosDoHorario(p.abertura), fechamento: minutosDoHorario(p.fechamento) }))
    .find((p) => p.abertura <= slot.minuto && slot.minuto < p.fechamento);
  return periodo ?? { abertura: slot.minuto, fechamento: slot.minuto + DURACAO_SLOT };
}

/** De 30 em 30 minutos, de `de` até `ate` (inclusive). */
function passos(de: number, ate: number): number[] {
  const lista: number[] = [];
  for (let m = de; m <= ate; m += 30) lista.push(m);
  return lista;
}

function FormularioReserva({ dia, slot, onFechar }: { dia: AgendaDia; slot: Slot; onFechar: () => void }) {
  const data = dia.data;
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ClienteResumo[] | null>(null);
  const [selecionado, setSelecionado] = useState<ClienteResumo | null>(null);
  const [cadastrando, setCadastrando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [repetir, setRepetir] = useState(false);
  // Horário diferente da 1h do slot (ex.: vôlei das 14h30 às 16h).
  const [mudandoHorario, setMudandoHorario] = useState(false);
  const [inicio, setInicio] = useState(slot.minuto);
  const [fim, setFim] = useState(slot.minuto + DURACAO_SLOT);
  const periodo = periodoDoSlot(dia, slot);
  const personalizado = inicio !== slot.minuto || fim !== slot.minuto + DURACAO_SLOT;
  const conflito = useMemo(
    () =>
      personalizado
        ? conflitoNoIntervalo(dia.slots, { inicio: instanteDoMinuto(data, inicio), fim: instanteDoMinuto(data, fim) })
        : undefined,
    [personalizado, dia.slots, data, inicio, fim],
  );
  const fixo = rotuloFixo(diaDaSemana(data), inicio);
  const [buscando, startBusca] = useTransition();
  const [salvando, startSalvar] = useTransition();

  // Busca com pequeno atraso enquanto digita; sem termo, mostra todos os clientes de A a Z.
  useEffect(() => {
    if (selecionado || cadastrando) return;
    const id = setTimeout(() => {
      startBusca(async () => setResultados(await pesquisarClientes(termo)));
    }, termo ? 250 : 0);
    return () => clearTimeout(id);
  }, [termo, selecionado, cadastrando]);

  const podeConfirmar = !conflito && (selecionado !== null || (cadastrando && novoNome.trim().length >= 2));
  // Já tem cliente com esse nome: escolher ele em vez de cadastrar de novo.
  const mesmoNome = termo.trim() ? resultados?.find((c) => chaveDoNome(c.nome) === chaveDoNome(termo)) : undefined;

  function mudarInicio(novo: number) {
    // Mantém a duração escolhida ao mudar o começo, sem passar do fechamento.
    setFim(Math.min(novo + (fim - inicio), periodo.fechamento));
    setInicio(novo);
  }

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
        minuto: inicio,
        fim: personalizado ? fim : undefined,
        clienteId: selecionado?.id,
        novoCliente: cadastrando ? { nome: novoNome, telefone: novoTelefone } : undefined,
        observacoes,
        repetirSemanal: repetir,
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      const nome = selecionado?.nome ?? novoNome.trim();
      const { semanas, puladas } = resultado.dados;
      if (!repetir) {
        toast.success(`Reservado: ${nome}, ${rotuloHorario(inicio)}`);
      } else if (puladas.length) {
        // Avisa sem esconder: essas semanas o horário já tinha dono ou estava bloqueado.
        toast.warning(`${nome}: fixo ${fixo}`, {
          description: `${semanas} semanas marcadas. Ficaram de fora (ocupado ou bloqueado): ${puladas
            .map((d) => formatarData(d, "dd/MM"))
            .join(", ")}.`,
          duration: 12000,
        });
      } else {
        toast.success(`${nome}: fixo ${fixo}`, { description: `${semanas} semanas já marcadas. As próximas entram sozinhas.` });
      }
      onFechar();
    });
  }

  return (
    <div className="flex max-h-full min-h-0 flex-col">
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <DrawerTitle className="font-placar text-[2rem] leading-none">
              {rotuloHorario(inicio)} às {rotuloHorario(fim)}
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-sm">
              {nomeDoDia(data)}, {formatarData(data, "d 'de' MMMM")}
            </DrawerDescription>
          </div>
          {!mudandoHorario && (
            <button
              type="button"
              onClick={() => setMudandoHorario(true)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
            >
              <Clock className="size-4" aria-hidden />
              Mudar horário
            </button>
          )}
        </div>

        {mudandoHorario && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="reserva-inicio">Começa</Label>
              <select
                id="reserva-inicio"
                value={inicio}
                onChange={(e) => mudarInicio(Number(e.target.value))}
                className="h-11 w-full rounded-lg border bg-card px-3 text-base font-semibold"
              >
                {passos(periodo.abertura, periodo.fechamento - 30).map((m) => (
                  <option key={m} value={m}>
                    {rotuloHorario(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reserva-fim">Termina</Label>
              <select
                id="reserva-fim"
                value={fim}
                onChange={(e) => setFim(Number(e.target.value))}
                className="h-11 w-full rounded-lg border bg-card px-3 text-base font-semibold"
              >
                {passos(inicio + 30, periodo.fechamento).map((m) => (
                  <option key={m} value={m}>
                    {rotuloHorario(m)}
                  </option>
                ))}
              </select>
            </div>
            {conflito && (
              <p role="alert" className="col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                {conflito.estado === "bloqueado"
                  ? `Choca com o bloqueio: ${conflito.bloqueio?.motivo}.`
                  : `Choca com ${conflito.reserva?.clienteNome}, que já tem parte desse horário.`}
              </p>
            )}
          </div>
        )}
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

            <ul className="mt-2 divide-y" aria-label={termo ? "Clientes encontrados" : "Clientes de A a Z"}>
              {!termo && resultados && resultados.length > 0 && (
                <li className="pt-2 pb-1 text-xs text-muted-foreground">Clientes de A a Z</li>
              )}
              {resultados?.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionado(c)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left outline-none focus-visible:bg-muted active:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {c.nome}
                        {c.id === mesmoNome?.id && (
                          <span className="ml-2 rounded-full bg-livre-fundo px-2 py-0.5 text-xs font-bold text-livre-tinta">
                            Já cadastrado
                          </span>
                        )}
                      </span>
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

            {mesmoNome ? (
              // O certo é tocar no cliente acima; cadastrar de novo só se for outra pessoa com o mesmo nome.
              <button
                type="button"
                onClick={comecarCadastro}
                className="mt-2 h-11 w-full rounded-full text-sm font-semibold text-muted-foreground"
              >
                É outra pessoa com esse nome? Cadastrar
              </button>
            ) : (
              <button
                type="button"
                onClick={comecarCadastro}
                className="mt-2 flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 text-left font-semibold outline-none focus-visible:border-ring"
              >
                <UserPlus className="size-5 shrink-0" aria-hidden />
                <span className="truncate">{termo.trim() ? `Cadastrar “${termo.trim()}”` : "Cadastrar cliente novo"}</span>
              </button>
            )}
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

            {/* Cliente fixo: escolinha, turma da firma etc. */}
            <label
              className={cn(
                "mt-3 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2 transition-colors",
                repetir ? "border-foreground bg-card" : "border-dashed",
              )}
            >
              <Repeat className="size-5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Repetir toda semana</span>
                <span className="block text-xs text-muted-foreground first-letter:uppercase">{fixo}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={repetir}
                onChange={(e) => setRepetir(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>
          </div>
        )}
      </div>

      <footer className="border-t px-5 pt-3 pb-4">
        <button
          type="button"
          onClick={confirmar}
          disabled={!podeConfirmar || salvando}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-full bg-livre text-base font-bold text-sobre-verde outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-40",
          )}
        >
          {salvando && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {repetir ? "Confirmar horário fixo" : "Confirmar reserva"}
        </button>
      </footer>
    </div>
  );
}
