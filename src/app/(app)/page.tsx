import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { exigirUsuario } from "@/lib/auth";
import { ehDataISO, hojeSP } from "@/lib/datas";
import { getAgendaDia } from "@/modules/agenda/consultas";
import { EsqueletoDia } from "@/modules/agenda/componentes/esqueleto-dia";
import { VisaoDia } from "@/modules/agenda/componentes/visao-dia";

export const metadata: Metadata = { title: "Hoje" };

export default function PaginaHoje({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<EsqueletoDia />}>
      <Dia searchParams={searchParams} />
    </Suspense>
  );
}

async function Dia({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { data: param } = await searchParams;
  await connection(); // usa o relógio: sempre renderizar na hora do request
  await exigirUsuario();

  const hoje = hojeSP();
  const data = ehDataISO(param) ? param : hoje;
  const dia = await getAgendaDia(data);

  return <VisaoDia key={data} dia={dia} hoje={hoje} />;
}
