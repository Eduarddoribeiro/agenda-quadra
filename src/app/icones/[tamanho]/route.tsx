import { ImageResponse } from "next/og";
import { IconeApp } from "@/lib/icone-app";

// /icones/192, /icones/512 e /icones/maskable (com margem de segurança para Android).
const TAMANHOS: Record<string, { tamanho: number; margem: number }> = {
  "192": { tamanho: 192, margem: 0 },
  "512": { tamanho: 512, margem: 0 },
  maskable: { tamanho: 512, margem: 64 },
};

export function generateStaticParams() {
  return Object.keys(TAMANHOS).map((tamanho) => ({ tamanho }));
}

export async function GET(_req: Request, { params }: RouteContext<"/icones/[tamanho]">) {
  const config = TAMANHOS[(await params).tamanho];
  if (!config) return new Response("Não encontrado", { status: 404 });
  return new ImageResponse(<IconeApp tamanho={config.tamanho} margem={config.margem} />, {
    width: config.tamanho,
    height: config.tamanho,
  });
}
