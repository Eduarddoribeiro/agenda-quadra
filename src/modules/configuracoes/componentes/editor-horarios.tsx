"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DIAS_SEMANA } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { salvarHorarios } from "../acoes";
import type { HorarioDia } from "../consultas";

// Segunda primeiro, como o dono pensa a semana.
const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0];
const HORAS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

function rotuloHora(hora: string) {
  return hora === "24:00" ? "00h (meia-noite)" : `${hora.slice(0, 2)}h`;
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

  function atualizar(diaSemana: number, mudanca: Partial<HorarioDia>) {
    setHorarios((atual) => atual.map((h) => (h.diaSemana === diaSemana ? { ...h, ...mudanca } : h)));
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
          return (
            <li key={dia} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("font-bold", !h.aberto && "text-muted-foreground")}>{DIAS_SEMANA[dia]}</span>
                <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
                  <span className={h.aberto ? "text-livre font-semibold" : "text-muted-foreground"}>
                    {h.aberto ? "Aberto" : "Fechado"}
                  </span>
                  {/* Interruptor acessível: um checkbox nativo com visual de chave */}
                  <input
                    type="checkbox"
                    role="switch"
                    checked={h.aberto}
                    onChange={(e) => atualizar(dia, { aberto: e.target.checked })}
                    aria-label={`${DIAS_SEMANA[dia]} aberto`}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-7 w-12 rounded-full bg-muted transition-colors peer-checked:bg-livre peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
                  />
                </label>
              </div>
              {h.aberto && (
                <div className="mt-2 flex items-center gap-2">
                  <SeletorHora
                    rotulo={`${DIAS_SEMANA[dia]}: abre às`}
                    valor={h.abertura}
                    onChange={(v) => atualizar(dia, { abertura: v })}
                    opcoes={HORAS.slice(0, 24)}
                  />
                  <span className="text-sm text-muted-foreground">até</span>
                  <SeletorHora
                    rotulo={`${DIAS_SEMANA[dia]}: fecha às`}
                    valor={h.fechamento}
                    onChange={(v) => atualizar(dia, { fechamento: v })}
                    opcoes={HORAS.slice(1)}
                  />
                </div>
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
