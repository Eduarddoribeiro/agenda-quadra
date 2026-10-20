// Telefones ficam salvos só com dígitos e DDI (ex.: 5547999990000), prontos para o wa.me.

export function normalizarTelefone(entrada: string): string | null {
  const digitos = entrada.replace(/\D/g, "");
  if (!digitos) return null;
  // DDD + número (10 ou 11 dígitos) → assume Brasil
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos;
}

export function telefoneValido(entrada: string): boolean {
  const normalizado = normalizarTelefone(entrada);
  return normalizado !== null && normalizado.length >= 12 && normalizado.length <= 13;
}

/** 5547999990000 → (47) 99999-0000 */
export function formatarTelefone(telefone: string | null | undefined): string {
  if (!telefone) return "";
  const local = telefone.startsWith("55") && telefone.length >= 12 ? telefone.slice(2) : telefone;
  const ddd = local.slice(0, 2);
  const numero = local.slice(2);
  if (numero.length === 9) return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
  if (numero.length === 8) return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
  return telefone;
}

export function linkWhatsApp(telefone: string | null | undefined, texto?: string): string {
  const query = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${telefone ?? ""}${query}`;
}
