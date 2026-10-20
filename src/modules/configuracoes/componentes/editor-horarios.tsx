"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DIAS_SEMANA, HORARIOS_MEIA_HORA, minutosDoHorario, rotuloHorario } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { salvarHorarios } from "../acoes";
import { iniciosDosSlots } from "@/modules/agenda/slots";
import type { HorarioDia, PeriodoHHMM } from "../consultas";

// Segunda primeiro, como o dono pensa a semana.
const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0];
const PADRAO: PeriodoHHMM = { abertura: "08:00", fechamento: "23:00" };

function rotuloHora(hora: string) {
  return hora === "24:00" ? "00h (meia-noite)" : rotuloHorario(minutosDoHorario(hora));
}

function horarioMais(hora: string, minutos: number) {
  const m = Math.min(minutosDoHorario(hora) + minutos, 24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
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

export function EditorHorarios({ horariosIniciais }: { horariosIniciais: HorarioDia[] }) {
  const [horarios, setHorarios] = useState(horariosIniciais);
  const [salvando, startTransition] = useTransition();
  const alterado = JSON.stringify(horarios) !== JSON.stringify(horariosIniciais);

  function mudarPeriodos(diaSemana: number, mudar: (periodos: PeriodoHHMM[]) => PeriodoHHMM[]) {
    setHorarios((atual) => atual.map((h) => (h.diaSemana === diaSemana ? { ...h, periodos: mudar(h.periodos) } : h)));
  }

  function salvar() {
    startTransition(async () => {
      const r = await salvarHorarios(horarios);
      if (r.ok) toast.success("Horários salvos");
      else toast.error(r.erro);
    });
  }

  return (
    <div>
      <ul className="divide-y rounded-xl border bg-card">
        {ORDEM_DIAS.map((dia) => {
          const h = horarios.find((x) => x.diaSemana === dia)!;
          const aberto = h.periodos.length > 0;
          const inicios = iniciosDosSlots(h.periodos);
          const ultimo = h.periodos.at(-1);
          return (
            <li key={dia} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("font-bold", !aberto && "text-muted-foreground")}>{DIAS_SEMANA[dia]}</span>
                <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
                  <span className={aberto ? "text-livre font-semibold" : "text-muted-foreground"}>
                    {aberto ? "Aberto" : "Fechado"}
                  </span>
                  {/* Interruptor acessível: um checkbox nativo com visual de chave */}
                  <input
                    type="checkbox"
                    role="switch"
                    checked={aberto}
                    onChange={(e) => mudarPeriodos(dia, () => (e.target.checked ? [PADRAO] : []))}
                    aria-label={`${DIAS_SEMANA[dia]} aberto`}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-7 w-12 rounded-full bg-muted transition-colors peer-checked:bg-livre peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
                  />
                </label>
              </div>

              {aberto && (
                <>
                  <ul className="mt-2 space-y-2">
                    {h.periodos.map((p, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <SeletorHora
                          rotulo={`${DIAS_SEMANA[dia]}, período ${i + 1}: começa às`}
                          valor={p.abertura}
                          onChange={(v) => mudarPeriodos(dia, (ps) => ps.map((x, j) => (j === i ? { ...x, abertura: v } : x)))}
                          opcoes={HORARIOS_MEIA_HORA.slice(0, -1)}
                        />
                        <span className="text-sm text-muted-foreground">até</span>
                        <SeletorHora
                          rotulo={`${DIAS_SEMANA[dia]}, período ${i + 1}: termina às`}
                          valor={p.fechamento}
                          onChange={(v) => mudarPeriodos(dia, (ps) => ps.map((x, j) => (j === i ? { ...x, fechamento: v } : x)))}
                          opcoes={HORARIOS_MEIA_HORA.slice(1)}
                        />
                        {h.periodos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => mudarPeriodos(dia, (ps) => ps.filter((_, j) => j !== i))}
                            aria-label={`Remover período ${i + 1} de ${DIAS_SEMANA[dia]}`}
                            className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
                          >
                            <X className="size-5" aria-hidden />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Mostra como os jogos ficam: é aqui que um período 18:30 faz diferença */}
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {inicios.length
                      ? `${inicios.length} ${inicios.length === 1 ? "horário" : "horários"}: ${inicios.map(rotuloHorario).join(", ")}`
                      : "Nenhum horário de 1 hora cabe nesse período."}
                  </p>

                  {ultimo && ultimo.fechamento < "23:30" && (
                    <button
                      type="button"
                      onClick={() =>
                        mudarPeriodos(dia, (ps) => [
                          ...ps,
                          { abertura: horarioMais(ultimo.fechamento, 30), fechamento: horarioMais(ultimo.fechamento, 30 + 4 * 60) },
                        ])
                      }
                      className="mt-1 -ml-2 inline-flex h-10 items-center gap-1 rounded-full px-2 text-sm font-semibold text-livre active:bg-muted"
                    >
                      <Plus className="size-4" aria-hidden />
                      Outro período
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {alterado && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-20 mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setHorarios(horariosIniciais)}
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
