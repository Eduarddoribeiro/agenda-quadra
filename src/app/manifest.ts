import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agenda da Quadra",
    short_name: "Quadra",
    description: "Horários livres e reservas da quadra de futsal.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e8ecf0",
    theme_color: "#e8ecf0",
    icons: [
      { src: "/icones/192", sizes: "192x192", type: "image/png" },
      { src: "/icones/512", sizes: "512x512", type: "image/png" },
      { src: "/icones/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Semana", url: "/semana" },
      { name: "Clientes", url: "/clientes" },
    ],
  };
}
