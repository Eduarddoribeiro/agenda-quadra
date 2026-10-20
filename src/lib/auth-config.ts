import { modoDemo } from "./demo";

// Sem login: no desenvolvimento local (AUTH_DESATIVADA=1, nunca em produção) e na
// demonstração, que é pública de propósito e tem banco próprio (ver lib/demo.ts).
export const authDesativada =
  (process.env.NODE_ENV !== "production" && process.env.AUTH_DESATIVADA === "1") || modoDemo;
