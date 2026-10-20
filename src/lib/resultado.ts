// Retorno padrão das server actions: a UI mostra `erro` direto para o usuário.
export type Resultado<T = undefined> = { ok: true; dados: T } | { ok: false; erro: string };

export function sucesso(): Resultado;
export function sucesso<T>(dados: T): Resultado<T>;
export function sucesso<T>(dados?: T): Resultado<T | undefined> {
  return { ok: true, dados };
}

export function falha(erro: string): { ok: false; erro: string } {
  return { ok: false, erro };
}

/** Código de erro do Postgres (postgres-js expõe `code`, às vezes dentro de `cause`). */
export function codigoPg(erro: unknown): string | undefined {
  const e = erro as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}
