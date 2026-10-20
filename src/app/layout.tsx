import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
import { Toaster } from "@/components/ui/sonner";
import { marca } from "@/lib/demo";
import "./globals.css";

// Uma família só: o eixo de largura (wdth) faz os numerais de placar e o texto corrido.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: { default: marca.nome, template: `%s – ${marca.nome}` },
  description: marca.descricao,
  applicationName: marca.nome,
  appleWebApp: { capable: true, title: marca.nomeCurto, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8ecf0" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1626" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster />
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
