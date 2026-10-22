"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { clientes, reservas, reservasFixas } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { falha, sucesso, type Resultado } from "@/lib/resultado";
import { normalizarTelefone, telefoneValido } from "@/lib/telefone";
import { buscarClientes, type ClienteResumo } from "./consultas";

export type DadosCliente = { nome: string; telefone: string; observacoes?: string };

function validar(dados: DadosCliente) {
  const nome = dados.nome.trim();
  const telefone = dados.telefone.trim();
  if (nome.length < 2) return falha("Informe o nome do cliente.");
  if (telefone && !telefoneValido(telefone)) return falha("Telefone inválido. Use DDD + número.");
  return {
    nome,
    telefone: telefone ? normalizarTelefone(telefone) : null,
    observacoes: dados.observacoes?.trim() || null,
  };
}

/** Usada pela busca do bottom sheet de reserva (client component). */
export async function pesquisarClientes(termo: string): Promise<ClienteResumo[]> {
  await exigirUsuario();
  return buscarClientes(termo, 8, "frequentes");
}

export async function criarCliente(dados: DadosCliente): Promise<Resultado<{ id: string }>> {
  await exigirUsuario();
  const valores = validar(dados);
  if ("ok" in valores) return valores;
  const [criado] = await db.insert(clientes).values(valores).returning({ id: clientes.id });
  refresh();
  return sucesso({ id: criado.id });
}

export async function atualizarCliente(id: string, dados: DadosCliente): Promise<Resultado> {
  await exigirUsuario();
  const valores = validar(dados);
  if ("ok" in valores) return valores;
  await db.update(clientes).set(valores).where(eq(clientes.id, id));
  refresh();
  return sucesso();
}

/**
 * Apaga o cliente junto com as reservas e horários fixos dele (ex.: cadastro duplicado).
 * Não tem volta: a tela confirma antes, mostrando quantos jogos somem.
 */
export async function excluirCliente(id: string): Promise<Resultado> {
  await exigirUsuario();
  await db.transaction(async (tx) => {
    await tx.delete(reservas).where(eq(reservas.clienteId, id));
    await tx.delete(reservasFixas).where(eq(reservasFixas.clienteId, id));
    await tx.delete(clientes).where(eq(clientes.id, id));
  });
  refresh();
  return sucesso();
}
