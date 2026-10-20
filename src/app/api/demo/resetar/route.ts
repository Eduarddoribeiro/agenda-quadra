import { db } from "@/db";
import { modoDemo, WHATSAPP_CONTATO } from "@/lib/demo";
import { resetarDemo } from "@/modules/demo/dados";

// Chamado toda madrugada pelo agendador (Vercel Cron manda "Authorization: Bearer $CRON_SECRET").
// Fora do modo demo a rota não existe.
export async function GET(request: Request) {
  const autorizacao = request.headers.get("authorization");
  if (!modoDemo) return new Response("Não encontrado", { status: 404 });

  const segredo = process.env.CRON_SECRET;
  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return new Response("Não autorizado", { status: 401 });
  }

  await resetarDemo(db, WHATSAPP_CONTATO);
  return Response.json({ ok: true, resetadoEm: new Date().toISOString() });
}
