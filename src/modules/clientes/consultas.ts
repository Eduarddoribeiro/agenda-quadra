import "server-only";
import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientes, reservas } from "@/db/schema";

export type ClienteResumo = {
  id: string;
  nome: string;
  telefone: string | null;
  totalReservas: number;
  ultimaReserva: Date | null;
};

// Subconsultas correlacionadas com nomes qualificados: sem o prefixo, "id" seria lido como reservas.id.
const totalReservas = sql<number>`(
  select count(*)::int from reservas r
  where r.cliente_id = "clientes"."id" and r.status = 'confirmada'
)`;

const ultimaReserva = sql<Date | null>`(
  select max(r.inicio) from reservas r
  where r.cliente_id = "clientes"."id" and r.status = 'confirmada'
)`.mapWith((v) => (v ? new Date(v) : null));

/**
 * Busca por nome ou telefone. Sem termo, ordena conforme `ordem`:
 * "frequentes" (mais reservas) ou "recentes" (último jogo mais novo).
 */
export async function buscarClientes(
  termo = "",
  limite = 50,
  ordem: "frequentes" | "recentes" = "recentes",
): Promise<ClienteResumo[]> {
  const busca = termo.trim();
  const digitos = busca.replace(/\D/g, "");

  const filtro = busca
    ? or(
        ilike(clientes.nome, `%${busca}%`),
        digitos.length >= 3 ? ilike(clientes.telefone, `%${digitos}%`) : undefined,
      )
    : undefined;

  return db
    .select({ id: clientes.id, nome: clientes.nome, telefone: clientes.telefone, totalReservas, ultimaReserva })
    .from(clientes)
    .where(filtro)
    .orderBy(
      busca
        ? asc(clientes.nome)
        : ordem === "frequentes"
          ? sql`${totalReservas} desc`
          : sql`${ultimaReserva} desc nulls last`,
      asc(clientes.nome),
    )
    .limit(limite);
}

export async function getCliente(id: string) {
  return db.query.clientes.findFirst({ where: eq(clientes.id, id) });
}

export async function getHistoricoCliente(clienteId: string) {
  return db
    .select({ id: reservas.id, inicio: reservas.inicio, fim: reservas.fim, status: reservas.status, observacoes: reservas.observacoes, fixaId: reservas.fixaId })
    .from(reservas)
    .where(eq(reservas.clienteId, clienteId))
    .orderBy(desc(reservas.inicio))
    .limit(100);
}
