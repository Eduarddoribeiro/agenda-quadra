import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { exigirUsuario } from "@/lib/auth";
import { buscarClientes } from "@/modules/clientes/consultas";
import { ListaClientes } from "@/modules/clientes/componentes/lista-clientes";

export const metadata: Metadata = { title: "Clientes" };

export default function PaginaClientes({ searchParams }: PageProps<"/clientes">) {
  return (
    <Suspense fallback={<EsqueletoClientes />}>
      <Clientes searchParams={searchParams} />
    </Suspense>
  );
}

async function Clientes({ searchParams }: Pick<PageProps<"/clientes">, "searchParams">) {
  const { q } = await searchParams;
  await exigirUsuario();
  const termo = typeof q === "string" ? q : "";
  const clientes = await buscarClientes(termo, 200);
  return <ListaClientes clientes={clientes} termoInicial={termo} />;
}

function EsqueletoClientes() {
  return (
    <div aria-busy aria-label="Carregando clientes" className="px-4 pt-4">
      <Skeleton className="h-11 w-44" />
      <Skeleton className="mt-3 h-11 w-full" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
