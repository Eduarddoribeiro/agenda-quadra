import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { exigirUsuario } from "@/lib/auth";
import { authDesativada } from "@/lib/auth-config";
import { hojeSP } from "@/lib/datas";
import { getQuadraPrincipal } from "@/modules/agenda/consultas";
import { getBloqueiosFuturos, getHorarios } from "@/modules/configuracoes/consultas";
import { Bloqueios } from "@/modules/configuracoes/componentes/bloqueios";
import { EditorHorarios } from "@/modules/configuracoes/componentes/editor-horarios";
import { sair } from "../../entrar/acoes";

export const metadata: Metadata = { title: "Ajustes" };

export default function PaginaAjustes() {
  return (
    <div>
      <header className="border-b px-4 pt-4 pb-3">
        <h1 className="font-placar text-[3.25rem] leading-[0.85]">Ajustes</h1>
      </header>
      <Suspense fallback={<EsqueletoAjustes />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}

async function Conteudo() {
  await connection();
  const usuario = await exigirUsuario();
  const [quadra, horarios, bloqueios] = await Promise.all([getQuadraPrincipal(), getHorarios(), getBloqueiosFuturos()]);

  return (
    <div className="space-y-8 px-4 pt-4">
      <section aria-labelledby="titulo-funcionamento">
        <h2 id="titulo-funcionamento" className="font-bold">Horário de funcionamento</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {quadra.nome}. Os horários livres são montados em jogos de 1 hora dentro deste período.
        </p>
        <EditorHorarios horariosIniciais={horarios} />
      </section>

      <section aria-labelledby="titulo-bloqueios">
        <h2 id="titulo-bloqueios" className="font-bold">Bloqueios</h2>
        <p className="mb-3 text-sm text-muted-foreground">Dias ou horas em que a quadra não pode ser reservada.</p>
        <Bloqueios bloqueios={bloqueios} hoje={hojeSP()} />
      </section>

      <section aria-labelledby="titulo-conta" className="pb-4">
        <h2 id="titulo-conta" className="mb-3 font-bold">Conta</h2>
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{usuario.nome}</p>
            <p className="text-xs text-muted-foreground">{usuario.papel === "dono" ? "Dono" : "Funcionário"}</p>
          </div>
          {!authDesativada && (
            <form action={sair}>
              <button
                type="submit"
                className="flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
              >
                <LogOut className="size-4" aria-hidden />
                Sair
              </button>
            </form>
          )}
        </div>
        {authDesativada && (
          <p className="mt-2 text-xs text-muted-foreground">Modo de desenvolvimento: login desativado.</p>
        )}
      </section>
    </div>
  );
}

function EsqueletoAjustes() {
  return (
    <div aria-busy aria-label="Carregando ajustes" className="space-y-3 px-4 pt-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
