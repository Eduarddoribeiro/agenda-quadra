// Atalho de desenvolvimento: roda o app sem Supabase Auth (ex.: com o banco local PGlite).
// Nunca vale em produção.
export const authDesativada =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DESATIVADA === "1";
