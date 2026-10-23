// Sem "server-only": a busca do bottom sheet também compara nomes no navegador.

/** Nome sem acento, minúsculo e com espaços simples: a chave para comparar nomes. */
export function chaveDoNome(nome: string): string {
  return nome.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");
}
