import "server-only";
import { db } from "@/db";
import { WHATSAPP_CONTATO } from "@/lib/demo";
import { resetarDemo } from "./dados";

/** De quanto em quanto tempo a demo volta aos dados de exemplo. */
const INTERVALO_RESET_MS = 60 * 60 * 1000;

// Por instância do servidor: confere no banco no máximo uma vez por minuto.
let conferidoEm = 0;

/**
 * Reset de hora em hora sem agendador: o primeiro acesso depois de 1h desde o último
 * reset recria os dados de exemplo antes de mostrar a tela.
 */
export async function resetarDemoSeVencida() {
  const agora = Date.now();
  if (agora - conferidoEm < 60_000) return;
  conferidoEm = agora;
  await resetarDemo(db, WHATSAPP_CONTATO, { somenteSeAntesDe: new Date(agora - INTERVALO_RESET_MS) });
}
