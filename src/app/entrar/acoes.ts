"use server";

import { redirect } from "next/navigation";
import { criarSupabaseServidor } from "@/lib/supabase/server";

export type EstadoLogin = { erro?: string; email?: string };

export async function entrar(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return { erro: "Preencha e-mail e senha.", email };

  const supabase = await criarSupabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    const msg =
      error.code === "invalid_credentials"
        ? "E-mail ou senha incorretos."
        : "Não foi possível entrar agora. Tente de novo em instantes.";
    return { erro: msg, email };
  }
  redirect("/");
}

export async function sair() {
  const supabase = await criarSupabaseServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
