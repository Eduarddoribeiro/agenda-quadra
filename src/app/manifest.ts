import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ginásio Krahe",
    short_name: "Krahe",
    description: "Agenda da quadra do Ginásio Krahe.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#e8ecf0",
    icons: [
      { src: "/icones/192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Semana", url: "/semana" },
      { name: "Clientes", url: "/clientes" },
    ],
  };
}
