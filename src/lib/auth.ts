import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { resetarDemoSeVencida } from "@/modules/demo/automatico";
import { authDesativada } from "./auth-config";
import { modoDemo } from "./demo";
import { criarSupabaseServidor } from "./supabase/server";

export type UsuarioAtual = {
  /** null só no modo de desenvolvimento sem auth */
  id: string | null;
  nome: string;
  papel: "dono" | "funcionario";
};

/**
 * Usuário logado (camada de acesso a dados). Redireciona para /entrar se não houver sessão.
 * No primeiro login cria a linha em `usuarios`: o primeiro vira dono, os demais funcionários.
 */
export async function exigirUsuario(): Promise<UsuarioAtual> {
  if (authDesativada) {
    // Toda tela e ação da demo passa por aqui: bom ponto para o reset de hora em hora.
    if (modoDemo) await resetarDemoSeVencida();
    return { id: null, nome: "Dono", papel: "dono" };
  }

  const supabase = await criarSupabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/entrar");

  const existente = await db.query.usuarios.findFirst({ where: eq(usuarios.id, claims.sub) });
  if (existente) return { id: existente.id, nome: existente.nome, papel: existente.papel };

  const jaTemDono = await db.query.usuarios.findFirst({ where: eq(usuarios.papel, "dono") });
  const nome = (claims.email as string | undefined)?.split("@")[0] ?? "Usuário";
  const [novo] = await db
    .insert(usuarios)
    .values({ id: claims.sub, nome, papel: jaTemDono ? "funcionario" : "dono" })
    .onConflictDoNothing()
    .returning();

  return novo
    ? { id: novo.id, nome: novo.nome, papel: novo.papel }
    : { id: claims.sub, nome, papel: "funcionario" };
}
