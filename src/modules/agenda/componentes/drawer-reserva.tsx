"use client";

import { ArrowLeftRight, Loader2, Phone, Repeat, UserRound } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconeWhatsApp } from "@/components/icone-whatsapp";
import { NumeralHorario } from "@/components/numeral-horario";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { diaDaSemana, formatarData, minutoSP, nomeDoDia, rotuloHorario, type DataISO } from "@/lib/datas";
import { formatarTelefone, linkWhatsApp } from "@/lib/telefone";
import { cn } from "@/lib/utils";
import { cancelarReserva, editarReserva, encerrarFixa, moverReserva, reativarReserva } from "../acoes";
import { rotuloFixo } from "../recorrencia";
import type { Slot } from "../slots";

type Props = {
  data: DataISO;
  slot: Slot | null;
  /** Slots livres do mesmo dia, para trocar o horário */
  livres: Slot[];
  onFechar: () => void;
};

export function DrawerReserva({ data, slot, livres, onFechar }: Props) {
  return (
    <Drawer open={slot !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DrawerContent className="pb-seguro">
        {slot?.reserva && (
          <DetalheReserva key={slot.reserva.id} data={data} slot={slot} livres={livres} onFechar={onFechar} />
        )}
      </DrawerContent>
    </Drawer>
  );
}

type Modo = "ver" | "trocar" | "cancelar";

function DetalheReserva({ data, slot, livres, onFechar }: { data: DataISO; slot: Slot; livres: Slot[]; onFechar: () => void }) {
  const reserva = slot.reserva!;
  const [modo, setModo] = useState<Modo>("ver");
  const [observacoes, setObservacoes] = useState(reserva.observacoes ?? "");
  const [pendente, startTransition] = useTransition();

  const dataLegivel = `${nomeDoDia(data)}, ${formatarData(data, "dd/MM")}`;
  // Horário do jogo, que pode não ser a 1h do slot (ex.: vôlei das 14h30 às 16h).
  const inicio = minutoSP(reserva.inicio);
  const fim = minutoSP(reserva.fim) || 1440;
  const fixo = rotuloFixo(diaDaSemana(data), inicio);
  const mensagem = `Olá, ${reserva.clienteNome.split(" ")[0]}! Confirmando sua reserva na quadra: ${dataLegivel.toLowerCase()}, das ${rotuloHorario(inicio)} às ${rotuloHorario(fim)}.`;
  const obsAlterada = observacoes.trim() !== (reserva.observacoes ?? "");

  function salvarObservacoes() {
    startTransition(async () => {
      const r = await editarReserva(reserva.id, { observacoes });
      if (r.ok) toast.success("Observação salva");
      else toast.error(r.erro);
    });
  }

  function trocarPara(destino: Slot) {
    startTransition(async () => {
      const r = await moverReserva(reserva.id, data, destino.minuto);
      if (!r.ok) return void toast.error(r.erro);
      toast.success(`${reserva.clienteNome} agora às ${rotuloHorario(destino.minuto)}`);
      onFechar();
    });
  }

  function encerrar() {
    startTransition(async () => {
      const r = await encerrarFixa(reserva.id);
      if (!r.ok) return void toast.error(r.erro);
      onFechar();
      const n = r.dados.canceladas;
      toast(`Horário fixo de ${reserva.clienteNome} encerrado`, {
        description: `${n} ${n === 1 ? "jogo cancelado" : "jogos cancelados"}, a partir de ${dataLegivel.toLowerCase()}.`,
      });
    });
  }

  function cancelar() {
    startTransition(async () => {
      const r = await cancelarReserva(reserva.id);
      if (!r.ok) return void toast.error(r.erro);
      onFechar();
      toast(`Reserva das ${rotuloHorario(inicio)} cancelada`, {
        description: `${reserva.clienteNome}, ${dataLegivel.toLowerCase()}`,
        duration: 8000,
        action: {
          label: "Desfazer",
          onClick: async () => {
            const volta = await reativarReserva(reserva.id);
            if (volta.ok) toast.success("Reserva de volta");
            else toast.error(volta.erro);
          },
        },
      });
    });
  }

  return (
    <div className="flex max-h-full min-h-0 flex-col">
      <header className="flex items-start gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <DrawerTitle className="truncate text-2xl font-extrabold">{reserva.clienteNome}</DrawerTitle>
          <DrawerDescription className="mt-0.5 text-sm">
            {dataLegivel}, {rotuloHorario(inicio)} às {rotuloHorario(fim)}
          </DrawerDescription>
          {reserva.fixaId && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              <Repeat className="size-3.5" aria-hidden />
              <span className="first-letter:uppercase">Fixo {fixo}</span>
            </p>
          )}
        </div>
        <NumeralHorario minuto={inicio} className="shrink-0 text-5xl" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {modo === "ver" && (
          <>
            {reserva.clienteTelefone ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <a
                  href={linkWhatsApp(reserva.clienteTelefone, mensagem)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-13 items-center justify-center gap-2 rounded-full bg-whatsapp font-bold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/60 dark:text-[#06210f]"
                >
                  <IconeWhatsApp className="size-5" />
                  Enviar confirmação
                </a>
                <a
                  href={`tel:+${reserva.clienteTelefone}`}
                  aria-label={`Ligar para ${formatarTelefone(reserva.clienteTelefone)}`}
                  className="grid size-13 place-items-center rounded-full border-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                >
                  <Phone className="size-5" aria-hidden />
                </a>
                <p className="col-span-2 text-center text-xs text-muted-foreground">
                  {formatarTelefone(reserva.clienteTelefone)}
                </p>
              </div>
            ) : (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                Cliente sem telefone. Adicione na ficha do cliente para conversar pelo WhatsApp.
              </p>
            )}

            <div className="mt-5 space-y-1.5">
              <Label htmlFor="obs-detalhe">Observação</Label>
              <Textarea
                id="obs-detalhe"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Nada anotado"
                rows={2}
              />
              {obsAlterada && (
                <button
                  type="button"
                  onClick={salvarObservacoes}
                  disabled={pendente}
                  className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Salvar observação
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModo("trocar")}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
              >
                <ArrowLeftRight className="size-4" aria-hidden />
                Trocar horário
              </button>
              <Link
                href={`/clientes/${reserva.clienteId}`}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
              >
                <UserRound className="size-4" aria-hidden />
                Ver cliente
              </Link>
            </div>
          </>
        )}

        {modo === "trocar" && (
          <div>
            <p className="font-bold">Mudar para qual horário?</p>
            <p className="text-sm text-muted-foreground">Horários livres em {dataLegivel.toLowerCase()}.</p>
            {livres.length === 0 ? (
              <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm">Nenhum outro horário livre neste dia.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-4 gap-2">
                {livres.map((s) => (
                  <li key={s.minuto}>
                    <button
                      type="button"
                      disabled={pendente}
                      onClick={() => trocarPara(s)}
                      className="font-placar h-14 w-full rounded-xl bg-livre-fundo text-2xl text-livre-tinta outline-none focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-50"
                    >
                      {rotuloHorario(s.minuto)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setModo("ver")}
              className="mt-4 h-11 w-full rounded-full text-sm font-semibold text-muted-foreground"
            >
              Voltar
            </button>
          </div>
        )}

        {modo === "cancelar" && (
          <div className="rounded-xl border-2 border-destructive/40 p-4">
            <p className="font-bold">Cancelar a reserva de {reserva.clienteNome}?</p>
            {reserva.fixaId ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  É um horário fixo ({fixo}). Escolha se é só este dia ou se ele parou de vir.
                </p>
                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={cancelar}
                    disabled={pendente}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-destructive font-bold text-white disabled:opacity-50"
                  >
                    Cancelar só {dataLegivel.toLowerCase()}
                  </button>
                  <button
                    type="button"
                    onClick={encerrar}
                    disabled={pendente}
                    className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-destructive font-bold text-destructive disabled:opacity-50"
                  >
                    {pendente && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Cancelar este e os próximos
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo("ver")}
                    className="h-11 rounded-full text-sm font-semibold text-muted-foreground"
                  >
                    Manter
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  O horário das {rotuloHorario(inicio)} volta a ficar livre.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModo("ver")}
                    className="h-12 rounded-full border font-semibold"
                  >
                    Manter
                  </button>
                  <button
                    type="button"
                    onClick={cancelar}
                    disabled={pendente}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-destructive font-bold text-white disabled:opacity-50"
                  >
                    {pendente && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Cancelar reserva
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modo === "ver" && (
        <footer className="border-t px-5 pt-2 pb-4">
          <button
            type="button"
            onClick={() => setModo("cancelar")}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold text-destructive outline-none focus-visible:ring-3 focus-visible:ring-destructive/40",
            )}
          >
            {/* Cartão vermelho */}
            <span aria-hidden className="h-5 w-3.5 -rotate-12 rounded-[3px] bg-destructive" />
            Cancelar reserva
          </button>
        </footer>
      )}
    </div>
  );
}
