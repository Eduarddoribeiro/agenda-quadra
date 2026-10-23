"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { clientes, reservas, reservasFixas } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { falha, sucesso, type Resultado } from "@/lib/resultado";
import { normalizarTelefone, telefoneValido } from "@/lib/telefone";
import { buscarClientes, type ClienteResumo } from "./consultas";
import { clienteExistenteOuNovo, getClientesRepetidos, juntarNoMesmo } from "./repetidos";

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

/** Se já existe cliente com o mesmo nome, devolve ele (`existente`) em vez de repetir o cadastro. */
export async function criarCliente(dados: DadosCliente): Promise<Resultado<{ id: string; existente: boolean }>> {
  await exigirUsuario();
  const valores = validar(dados);
  if ("ok" in valores) return valores;
  const cliente = await db.transaction((tx) => clienteExistenteOuNovo(tx, valores));
  refresh();
  return sucesso(cliente);
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

/** Junta um cadastro repetido no outro: os jogos passam para `destinoId` e `origemId` some. */
export async function juntarClientes(origemId: string, destinoId: string): Promise<Resultado> {
  await exigirUsuario();
  if (origemId === destinoId) return falha("Escolha outro cliente.");
  const juntou = await db.transaction((tx) => juntarNoMesmo(tx, origemId, destinoId));
  if (!juntou) return falha("Cliente não encontrado.");
  refresh();
  return sucesso();
}

/** Junta de uma vez todos os cadastros com o mesmo nome (e sem telefones diferentes). */
export async function juntarRepetidos(): Promise<Resultado<{ removidos: number }>> {
  await exigirUsuario();
  const grupos = await getClientesRepetidos();
  let removidos = 0;
  await db.transaction(async (tx) => {
    for (const [destino, ...origens] of grupos.map((g) => g.ids)) {
      for (const origem of origens) if (await juntarNoMesmo(tx, origem, destino)) removidos++;
    }
  });
  refresh();
  return sucesso({ removidos });
}
