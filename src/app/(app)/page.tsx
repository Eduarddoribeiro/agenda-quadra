import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { exigirUsuario } from "@/lib/auth";
import { ehDataISO, hojeSP, inicioDaSemana, type DataISO } from "@/lib/datas";
import { getAgenda, type AgendaDia } from "@/modules/agenda/consultas";
import { EsqueletoDia } from "@/modules/agenda/componentes/esqueleto-dia";
import { VisaoDia, type OcupacaoSemana } from "@/modules/agenda/componentes/visao-dia";
import { slotsLivresFuturos } from "@/modules/agenda/slots";

export const metadata: Metadata = { title: "Hoje" };

/** Quantos dias à frente o botão "Reservar" da barra procura um horário livre. */
const DIAS_BUSCA_LIVRE = 14;

export default function PaginaHoje({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<EsqueletoDia />}>
      <Dia searchParams={searchParams} />
    </Suspense>
  );
}

/** Ocupação de cada dia da semana em uma letra por horário, para a faixa da semana. */
function ocupacaoDaSemana(dias: AgendaDia[]): OcupacaoSemana {
  return Object.fromEntries(
    dias.map((d) => [
      d.data,
      d.slots.map((s) => (s.passado ? "p" : s.estado === "livre" ? "l" : s.estado === "reservado" ? "r" : "b")).join(""),
    ]),
  );
}

async function Dia({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { data: param, reservar } = await searchParams;
  await connection(); // usa o relógio: sempre renderizar na hora do request
  await exigirUsuario();

  const hoje = hojeSP();
  let data: DataISO = ehDataISO(param) ? param : hoje;

  // Botão "Reservar" da barra: vai para o primeiro dia (a partir de hoje) que ainda tem horário livre.
  let abrirReserva: "sim" | "sem-livres" | null = null;
  if (reservar) {
    const proximos = await getAgenda(hoje, DIAS_BUSCA_LIVRE);
    const alvo = proximos.find((d) => slotsLivresFuturos(d.slots).length > 0);
    data = alvo?.data ?? hoje;
    abrirReserva = alvo ? "sim" : "sem-livres";
  }

  const semana = await getAgenda(inicioDaSemana(data), 7);
  const dia = semana.find((d) => d.data === data)!;

  return (
    <VisaoDia key={data} dia={dia} hoje={hoje} ocupacao={ocupacaoDaSemana(semana)} abrirReserva={abrirReserva} />
  );
}
