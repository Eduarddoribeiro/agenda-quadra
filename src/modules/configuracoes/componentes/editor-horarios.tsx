"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { DIAS_SEMANA, DIAS_SEMANA_CURTOS, HORARIOS_MEIA_HORA, minutosDoHorario, rotuloHorario } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { salvarHorarios } from "../acoes";
import { iniciosDosSlots } from "@/modules/agenda/slots";
import type { HorarioDia, PeriodoHHMM } from "../consultas";
import { estadoInicial, horariosDoEstado, ORDEM_DIAS, type ModoDia } from "../horario-padrao";

function rotuloHora(hora: string) {
  return hora === "24:00" ? "00h (meia-noite)" : rotuloHorario(minutosDoHorario(hora));
}

function horarioMais(hora: string, minutos: number) {
  const m = Math.min(minutosDoHorario(hora) + minutos, 24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "15 jogos de 1h: 08h a 22h" quando é tudo seguido; senão a lista dos horários. */
function resumoDosJogos(periodos: PeriodoHHMM[]) {
  const inicios = iniciosDosSlots(periodos);
  if (!inicios.length) return "Nenhum jogo de 1 hora cabe nesse horário.";
  const seguidos = inicios.every((m, i) => i === 0 || m - inicios[i - 1] === 60);
  const n = `${inicios.length} ${inicios.length === 1 ? "jogo" : "jogos"} de 1h`;
  return seguidos && inicios.length > 2
    ? `${n}, começando das ${rotuloHorario(inicios[0])} às ${rotuloHorario(inicios.at(-1)!)}`
    : `${n}: ${inicios.map(rotuloHorario).join(", ")}`;
}

function SeletorHora({
  valor,
  onChange,
  rotulo,
  opcoes,
}: {
  valor: string;
  onChange: (v: string) => void;
  rotulo: string;
  opcoes: string[];
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={rotulo}
      className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-2 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
    >
      {opcoes.map((h) => (
        <option key={h} value={h}>
          {rotuloHora(h)}
        </option>
      ))}
    </select>
  );
}

/** Um ou mais períodos (ex.: 08h–18h e 18h30–22h30), com o resumo dos jogos que eles geram. */
function EditorPeriodos({
  nome,
  periodos,
  onChange,
}: {
  nome: string;
  periodos: PeriodoHHMM[];
  onChange: (ps: PeriodoHHMM[]) => void;
}) {
  const ultimo = periodos.at(-1);
  return (
    <div>
      <ul className="space-y-2">
        {periodos.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <SeletorHora
              rotulo={`${nome}, período ${i + 1}: começa às`}
              valor={p.abertura}
              onChange={(v) => onChange(periodos.map((x, j) => (j === i ? { ...x, abertura: v } : x)))}
              opcoes={HORARIOS_MEIA_HORA.slice(0, -1)}
            />
            <span className="text-sm text-muted-foreground">até</span>
            <SeletorHora
              rotulo={`${nome}, período ${i + 1}: termina às`}
              valor={p.fechamento}
              onChange={(v) => onChange(periodos.map((x, j) => (j === i ? { ...x, fechamento: v } : x)))}
              opcoes={HORARIOS_MEIA_HORA.slice(1)}
            />
            {periodos.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(periodos.filter((_, j) => j !== i))}
                aria-label={`Remover período ${i + 1} de ${nome}`}
                className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
              >
                <X className="size-5" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Mostra como os jogos ficam: é aqui que um período 18:30 faz diferença */}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{resumoDosJogos(periodos)}</p>

      {ultimo && ultimo.fechamento < "23:30" && (
        <button
          type="button"
          onClick={() =>
            onChange([
              ...periodos,
              { abertura: horarioMais(ultimo.fechamento, 30), fechamento: horarioMais(ultimo.fechamento, 30 + 4 * 60) },
            ])
          }
          className="mt-1 -ml-2 inline-flex h-10 items-center gap-1 rounded-full px-2 text-sm font-semibold text-livre active:bg-muted"
        >
          <Plus className="size-4" aria-hidden />
          Outro período
        </button>
      )}
    </div>
  );
}

export function EditorHorarios({ horariosIniciais }: { horariosIniciais: HorarioDia[] }) {
  const inicial = useMemo(() => estadoInicial(horariosIniciais), [horariosIniciais]);
  const [estado, setEstado] = useState(inicial);
  const [salvando, startTransition] = useTransition();
  const { padrao, modos, proprios } = estado;
  const horarios = horariosDoEstado(estado);
  const alterado = JSON.stringify(horarios) !== JSON.stringify(horariosDoEstado(inicial));

  const diasProprios = ORDEM_DIAS.filter((d) => modos[d] === "proprio");
  const diasNoPadrao = ORDEM_DIAS.filter((d) => modos[d] === "padrao");

  function mudarModo(dia: number, modo: ModoDia) {
    setEstado((e) => ({
      ...e,
      modos: { ...e.modos, [dia]: modo },
      // Dia novo com horário próprio começa igual ao padrão, para só ajustar o que muda.
      proprios: modo === "proprio" && !e.proprios[dia] ? { ...e.proprios, [dia]: e.padrao } : e.proprios,
    }));
  }

  function salvar() {
    startTransition(async () => {
      const r = await salvarHorarios(horarios);
      if (r.ok) toast.success("Horários salvos");
      else toast.error(r.erro);
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card px-4 py-3">
        <p className="mb-2 font-bold">Horário padrão</p>
        <EditorPeriodos nome="Horário padrão" periodos={padrao} onChange={(ps) => setEstado((e) => ({ ...e, padrao: ps }))} />

        <p className="mt-3 text-sm font-semibold">Dias abertos</p>
        <div className="mt-2 grid grid-cols-7 gap-1" role="group" aria-label="Dias em que a quadra abre">
          {ORDEM_DIAS.map((dia) => {
            const aberto = modos[dia] !== "fechado";
            return (
              <button
                key={dia}
                type="button"
                aria-pressed={aberto}
                aria-label={`${DIAS_SEMANA[dia]}: ${aberto ? "aberto" : "fechado"}`}
                onClick={() => mudarModo(dia, aberto ? "fechado" : "padrao")}
                className={cn(
                  "h-11 rounded-lg text-xs font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
                  !aberto
                    ? "bg-muted text-muted-foreground line-through"
                    : modos[dia] === "proprio"
                      ? "border-2 border-livre text-livre-tinta"
                      : "bg-livre-fundo text-livre-tinta",
                )}
              >
                {DIAS_SEMANA_CURTOS[dia]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Toque num dia para abrir ou fechar a quadra. Dia com contorno tem horário diferente (abaixo).
        </p>
      </div>

      <div className="rounded-xl border bg-card px-4 py-3">
        <p className="font-bold">Dias com horário diferente</p>
        {diasProprios.length === 0 && (
          <p className="mt-1 text-sm text-muted-foreground">Todos os dias abertos seguem o horário padrão.</p>
        )}
        <ul className="divide-y">
          {diasProprios.map((dia) => (
            <li key={dia} className="py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-semibold">{DIAS_SEMANA[dia]}</span>
                <button
                  type="button"
                  onClick={() => mudarModo(dia, "padrao")}
                  className="h-9 rounded-full px-3 text-sm font-semibold text-muted-foreground active:bg-muted"
                >
                  Usar o padrão
                </button>
              </div>
              <EditorPeriodos
                nome={DIAS_SEMANA[dia]}
                periodos={proprios[dia]}
                onChange={(ps) => setEstado((e) => ({ ...e, proprios: { ...e.proprios, [dia]: ps } }))}
              />
            </li>
          ))}
        </ul>

        {diasNoPadrao.length > 0 && (
          // Select nativo com cara de botão: no celular abre a lista de dias do próprio sistema.
          <label className="relative mt-2 flex h-11 cursor-pointer items-center gap-1 rounded-full border-2 border-dashed px-4 text-sm font-semibold focus-within:ring-3 focus-within:ring-ring/60">
            <Plus className="size-4" aria-hidden />
            Dia com horário diferente
            <select
              value=""
              onChange={(e) => e.target.value && mudarModo(Number(e.target.value), "proprio")}
              aria-label="Escolher dia com horário diferente"
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">Escolha o dia</option>
              {diasNoPadrao.map((d) => (
                <option key={d} value={d}>
                  {DIAS_SEMANA[d]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {alterado && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+2.25rem)] z-20 flex gap-2">
          <button
            type="button"
            onClick={() => setEstado(inicial)}
            className="h-12 flex-1 rounded-full border bg-card font-semibold"
          >
            Desfazer
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground shadow-lg disabled:opacity-50"
          >
            {salvando && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Salvar horários
          </button>
        </div>
      )}
    </div>
  );
}
