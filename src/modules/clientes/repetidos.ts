import "server-only";
import { asc, eq, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import { db } from "@/db";
import { clientes, reservas, reservasFixas } from "@/db/schema";
import { chaveDoNome } from "./nomes";

// Evita cliente repetido: "Escola de Vôlei", "escola de volei " e "ESCOLA DE VÔLEI" são o mesmo nome.

type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];

const COM_ACENTO = "áàâãäåéèêëíìîïóòôõöúùûüçñ";
const SEM_ACENTO = "aaaaaaeeeeiiiiooooouuuucn";

/** A mesma chave de `chaveDoNome`, calculada no banco. */
export function chaveDoNomeSql(coluna: AnyColumn | SQL): SQL<string> {
  return sql<string>`translate(regexp_replace(trim(lower(${coluna})), '[[:space:]]+', ' ', 'g'), ${COM_ACENTO}, ${SEM_ACENTO})`;
}

/**
 * Cliente já cadastrado com o mesmo nome. Telefones diferentes = pessoas diferentes
 * (dois "Lucas"); se um dos lados não tem telefone, é o mesmo cliente.
 */
export async function acharClienteIgual(
  tx: Transacao,
  novo: { nome: string; telefone: string | null },
): Promise<{ id: string; telefone: string | null } | undefined> {
  const candidatos = await tx
    .select({ id: clientes.id, telefone: clientes.telefone })
    .from(clientes)
    .where(eq(chaveDoNomeSql(clientes.nome), chaveDoNome(novo.nome)))
    .orderBy(asc(clientes.createdAt));
  return (
    candidatos.find((c) => novo.telefone && c.telefone === novo.telefone) ??
    candidatos.find((c) => !novo.telefone || !c.telefone)
  );
}

/** Usa o cliente igual que já existe (completando o telefone) ou cadastra um novo. */
export async function clienteExistenteOuNovo(
  tx: Transacao,
  novo: { nome: string; telefone: string | null; observacoes?: string | null },
): Promise<{ id: string; existente: boolean }> {
  const igual = await acharClienteIgual(tx, novo);
  if (igual) {
    if (!igual.telefone && novo.telefone) {
      await tx.update(clientes).set({ telefone: novo.telefone }).where(eq(clientes.id, igual.id));
    }
    return { id: igual.id, existente: true };
  }
  const [criado] = await tx.insert(clientes).values(novo).returning({ id: clientes.id });
  return { id: criado.id, existente: false };
}

/**
 * Passa os jogos e horários fixos de `origemId` para `destinoId` e apaga a origem.
 * Telefone e observações da origem completam o destino quando ele não tem.
 */
export async function juntarNoMesmo(tx: Transacao, origemId: string, destinoId: string) {
  const [origem] = await tx.select().from(clientes).where(eq(clientes.id, origemId));
  const [destino] = await tx.select().from(clientes).where(eq(clientes.id, destinoId));
  if (!origem || !destino) return false;

  await tx.update(reservas).set({ clienteId: destinoId }).where(eq(reservas.clienteId, origemId));
  await tx.update(reservasFixas).set({ clienteId: destinoId }).where(eq(reservasFixas.clienteId, origemId));
  await tx
    .update(clientes)
    .set({
      telefone: destino.telefone ?? origem.telefone,
      observacoes: destino.observacoes ?? origem.observacoes,
      createdAt: origem.createdAt < destino.createdAt ? origem.createdAt : destino.createdAt,
    })
    .where(eq(clientes.id, destinoId));
  await tx.delete(clientes).where(eq(clientes.id, origemId));
  return true;
}

export type GrupoRepetido = { nome: string; ids: string[] };

/**
 * Cadastros com o mesmo nome que dá para juntar sozinho (telefones não conflitam).
 * O primeiro id de cada grupo é o que fica: o que mais jogou.
 */
export async function getClientesRepetidos(): Promise<GrupoRepetido[]> {
  const linhas = await db
    .select({
      id: clientes.id,
      nome: clientes.nome,
      telefone: clientes.telefone,
      chave: chaveDoNomeSql(clientes.nome),
      jogos: sql<number>`(select count(*)::int from reservas r where r.cliente_id = "clientes"."id")`,
    })
    .from(clientes)
    .orderBy(asc(clientes.createdAt));

  const porChave = new Map<string, typeof linhas>();
  for (const l of linhas) porChave.set(l.chave, [...(porChave.get(l.chave) ?? []), l]);
  const grupos: GrupoRepetido[] = [];
  for (const membros of porChave.values()) {
    if (membros.length < 2) continue;
    const telefones = new Set(membros.map((m) => m.telefone).filter(Boolean));
    if (telefones.size > 1) continue; // pessoas diferentes com o mesmo nome: junta à mão, se for o caso
    const ordem = [...membros].sort((a, b) => b.jogos - a.jogos);
    grupos.push({ nome: ordem[0].nome, ids: ordem.map((m) => m.id) });
  }
  return grupos;
}
