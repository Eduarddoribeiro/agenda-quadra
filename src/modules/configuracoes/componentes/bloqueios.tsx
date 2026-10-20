"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataSP, formatarSP, nomeDoDia, somarDias, type DataISO } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { criarBloqueio, removerBloqueio } from "../acoes";

type Bloqueio = { id: string; inicio: Date; fim: Date; motivo: string };

const MOTIVOS = ["Manutenção", "Feriado", "Evento", "Campeonato"];
const HORAS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

function descreverPeriodo(b: Bloqueio) {
  const dia = dataSP(b.inicio);
  const diaFim = dataSP(new Date(b.fim.getTime() - 1));
  const inicioMeiaNoite = formatarSP(b.inicio, "HH:mm") === "00:00";
  const fimMeiaNoite = formatarSP(b.fim, "HH:mm") === "00:00";
  const nome = `${nomeDoDia(dia)}, ${formatarSP(b.inicio, "dd/MM")}`;

  if (dia === diaFim && inicioMeiaNoite && fimMeiaNoite) return { dia: nome, horas: "Dia inteiro" };
  if (dia !== diaFim) return { dia: `${formatarSP(b.inicio, "dd/MM")} a ${formatarSP(b.fim, "dd/MM")}`, horas: "Vários dias" };
  return {
    dia: nome,
    horas: `${formatarSP(b.inicio, "HH")}h às ${fimMeiaNoite ? "00" : formatarSP(b.fim, "HH")}h`,
  };
}

export function Bloqueios({ bloqueios, hoje }: { bloqueios: Bloqueio[]; hoje: DataISO }) {
  const [aberto, setAberto] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remover(b: Bloqueio) {
    setRemovendo(b.id);
    startTransition(async () => {
      const r = await removerBloqueio(b.id);
      setRemovendo(null);
      if (r.ok) toast.success("Bloqueio removido. O horário voltou a ficar livre.");
      else toast.error(r.erro);
    });
  }

  return (
    <div>
      {bloqueios.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
          Nenhum bloqueio marcado. Bloqueie horários para manutenção, feriados ou eventos e eles somem da lista de livres.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {bloqueios.map((b) => {
            const { dia, horas } = descreverPeriodo(b);
            return (
              <li key={b.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                <span aria-hidden className="h-6 w-4 shrink-0 -rotate-12 rounded-[3px] bg-amarelo" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{b.motivo}</span>
                  <span className="block text-xs text-muted-foreground">
                    {dia}, {horas.toLowerCase()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remover(b)}
                  disabled={removendo === b.id}
                  aria-label={`Remover bloqueio: ${b.motivo}, ${dia}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted"
                >
                  {removendo === b.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-foreground font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-muted"
      >
        <Plus className="size-5" aria-hidden />
        Bloquear horário
      </button>

      <Drawer open={aberto} onOpenChange={setAberto}>
        <DrawerContent className="pb-seguro">
          {aberto && <NovoBloqueio hoje={hoje} onFechar={() => setAberto(false)} />}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function NovoBloqueio({ hoje, onFechar }: { hoje: DataISO; onFechar: () => void }) {
  const [data, setData] = useState(somarDias(hoje, 1));
  const [diaInteiro, setDiaInteiro] = useState(true);
  const [horaInicio, setHoraInicio] = useState("18:00");
  const [horaFim, setHoraFim] = useState("20:00");
  const [motivo, setMotivo] = useState("Manutenção");
  const [salvando, startTransition] = useTransition();

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await criarBloqueio({
        data,
        horaInicio: diaInteiro ? undefined : horaInicio,
        horaFim: diaInteiro ? undefined : horaFim,
        motivo,
      });
      if (!r.ok) return void toast.error(r.erro, { duration: 6000 });
      toast.success("Horário bloqueado");
      onFechar();
    });
  }

  const classeSelect =
    "h-11 w-full rounded-lg border border-input bg-card px-2 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60";

  return (
    <form onSubmit={salvar} className="flex max-h-full min-h-0 flex-col">
      <header className="px-5 pt-5 pb-3">
        <DrawerTitle className="text-2xl font-extrabold">Bloquear horário</DrawerTitle>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        <div className="space-y-1.5">
          <Label htmlFor="bloqueio-data">Dia</Label>
          <Input id="bloqueio-data" type="date" value={data} min={hoje} onChange={(e) => setData(e.target.value)} required />
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Período</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {[true, false].map((opcao) => (
              <button
                key={String(opcao)}
                type="button"
                aria-pressed={diaInteiro === opcao}
                onClick={() => setDiaInteiro(opcao)}
                className={cn(
                  "h-10 rounded-lg text-sm font-semibold",
                  diaInteiro === opcao ? "bg-card shadow-sm" : "text-muted-foreground",
                )}
              >
                {opcao ? "Dia inteiro" : "Algumas horas"}
              </button>
            ))}
          </div>
          {!diaInteiro && (
            <div className="mt-2 flex items-center gap-2">
              <select aria-label="Das" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={classeSelect}>
                {HORAS.slice(0, 24).map((h) => <option key={h} value={h}>{h.slice(0, 2)}h</option>)}
              </select>
              <span className="text-sm text-muted-foreground">até</span>
              <select aria-label="Até" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className={classeSelect}>
                {HORAS.slice(1).map((h) => <option key={h} value={h}>{h === "24:00" ? "00h" : `${h.slice(0, 2)}h`}</option>)}
              </select>
            </div>
          )}
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="bloqueio-motivo">Motivo</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Motivos comuns">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotivo(m)}
                aria-pressed={motivo === m}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-sm font-semibold",
                  motivo === m ? "border-amarelo bg-amarelo-fundo text-amarelo-tinta" : "bg-card",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Input id="bloqueio-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
        </div>
      </div>
      <footer className="border-t px-5 pt-3 pb-4">
        <button
          type="submit"
          disabled={salvando || !motivo.trim()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-amarelo text-base font-bold text-[#2b2100] outline-none focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-40"
        >
          {salvando && <Loader2 className="size-5 animate-spin" aria-hidden />}
          Bloquear
        </button>
      </footer>
    </form>
  );
}
