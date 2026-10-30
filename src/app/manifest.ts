import type { MetadataRoute } from "next";
import { marca } from "@/lib/demo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: marca.nome,
    short_name: marca.nomeCurto,
    description: marca.descricao,
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: `${marca.icones}/192.png`, sizes: "192x192", type: "image/png" },
      { src: `${marca.icones}/512.png`, sizes: "512x512", type: "image/png" },
      { src: `${marca.icones}/maskable.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Semana", url: "/semana" },
      { name: "Clientes", url: "/clientes" },
    ],
  };
}
