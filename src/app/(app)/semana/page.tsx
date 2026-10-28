import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { exigirUsuario } from "@/lib/auth";
import { ehDataISO, hojeSP, inicioDaSemana } from "@/lib/datas";
import { getAgenda } from "@/modules/agenda/consultas";
import { VisaoSemana } from "@/modules/agenda/componentes/visao-semana";

export const metadata: Metadata = { title: "Semana" };

export default function PaginaSemana({ searchParams }: PageProps<"/semana">) {
  return (
    <Suspense fallback={<EsqueletoSemana />}>
      <Semana searchParams={searchParams} />
    </Suspense>
  );
}

async function Semana({ searchParams }: Pick<PageProps<"/semana">, "searchParams">) {
  const { inicio } = await searchParams;
  await connection();
  await exigirUsuario();

  const hoje = hojeSP();
  const segunda = inicioDaSemana(ehDataISO(inicio) ? inicio : hoje);
  const dias = await getAgenda(segunda, 7);

  return <VisaoSemana dias={dias} segunda={segunda} hoje={hoje} />;
}

function EsqueletoSemana() {
  return (
    <div aria-busy aria-label="Carregando semana">
      <div className="cabecalho px-4 pt-4 pb-3">
        <Skeleton className="h-11 w-44" />
        <Skeleton className="mt-2 h-4 w-36" />
      </div>
      <div className="space-y-2 px-4 pt-4">
        <Skeleton className="mb-6 h-5 w-40" />
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-18 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
