"use client";

import { CalendarRange, Plus, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { hojeSP } from "@/lib/datas";

const ITENS = [
  { href: "/", rotulo: "Hoje", icone: null },
  { href: "/semana", rotulo: "Semana", icone: CalendarRange },
  { href: "/clientes", rotulo: "Clientes", icone: Users },
  { href: "/ajustes", rotulo: "Ajustes", icone: Settings2 },
] as const;

const semAssinatura = () => () => {};

/** Ícone do "Hoje": um calendarinho com o número do dia (calculado só no navegador). */
function IconeHoje() {
  const dia = useSyncExternalStore(semAssinatura, () => Number(hojeSP().slice(8)), () => null);
  return (
    <span
      aria-hidden
      className="relative grid size-6 place-items-center rounded-[5px] border-2 border-current pt-0.5 text-[11px] leading-none font-extrabold font-estreita"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-current" />
      {dia}
    </span>
  );
}

export function BarraNavegacao() {
  return <BarraNavegacaoBase pathname={usePathname()} />;
}

/**
 * Botão do meio da barra, no lugar mais fácil para o polegar: abre a gaveta de reservar
 * já no próximo horário livre (hoje ou nos dias seguintes), de qualquer tela.
 */
function BotaoReservar() {
  return (
    <li className="relative flex justify-center">
      <Link
        href="/?reservar=1"
        scroll={false}
        className="group flex flex-col items-center gap-1 text-xs font-bold text-livre outline-none"
      >
        <span className="-mt-6 grid size-14 place-items-center rounded-full bg-livre text-sobre-verde ring-[5px] ring-background transition-transform group-active:scale-95 group-focus-visible:ring-ring/60">
          <Plus className="size-7" strokeWidth={2.75} aria-hidden />
        </span>
        Reservar
      </Link>
    </li>
  );
}

/** Versão sem hook: serve de fallback do Suspense enquanto a rota atual não é conhecida. */
export function BarraNavegacaoBase({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Principal"
      className="pb-seguro fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITENS.flatMap(({ href, rotulo, icone: Icone }, i) => {
          const ativo = pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
          const item = (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors outline-none focus-visible:bg-muted",
                  ativo ? "font-bold text-foreground" : "text-muted-foreground",
                )}
              >
                {/* Marca do item ativo: uma linha de quadra no topo */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-[3px] w-10 rounded-b-full bg-destaque transition-opacity",
                    ativo ? "opacity-100" : "opacity-0",
                  )}
                />
                {Icone ? <Icone className="size-6" strokeWidth={ativo ? 2.4 : 1.8} /> : <IconeHoje />}
                {rotulo}
              </Link>
            </li>
          );
          return i === 2 ? [<BotaoReservar key="reservar" />, item] : [item];
        })}
      </ul>
    </nav>
  );
}
