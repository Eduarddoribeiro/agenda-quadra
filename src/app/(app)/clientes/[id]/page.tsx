import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { exigirUsuario } from "@/lib/auth";
import { getCliente, getHistoricoCliente } from "@/modules/clientes/consultas";
import { FichaCliente } from "@/modules/clientes/componentes/ficha-cliente";

export const metadata: Metadata = { title: "Cliente" };

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PaginaCliente({ params }: PageProps<"/clientes/[id]">) {
  return (
    <Suspense fallback={<EsqueletoFicha />}>
      <Ficha params={params} />
    </Suspense>
  );
}

async function Ficha({ params }: Pick<PageProps<"/clientes/[id]">, "params">) {
  const { id } = await params;
  await connection();
  await exigirUsuario();
  if (!REGEX_UUID.test(id)) notFound();

  const [cliente, historico] = await Promise.all([getCliente(id), getHistoricoCliente(id)]);
  if (!cliente) notFound();

  return <FichaCliente cliente={cliente} historico={historico} agora={new Date()} />;
}

function EsqueletoFicha() {
  return (
    <div aria-busy aria-label="Carregando cliente" className="px-4 pt-14">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-32" />
      <Skeleton className="mt-4 h-12 w-full rounded-full" />
      <Skeleton className="mt-5 h-20 w-full rounded-xl" />
      <Skeleton className="mt-6 h-40 w-full rounded-xl" />
    </div>
  );
}
