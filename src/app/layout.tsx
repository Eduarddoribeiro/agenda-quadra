import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Uma família só: o eixo de largura (wdth) faz os numerais de placar e o texto corrido.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: { default: "Agenda da Quadra", template: "%s – Agenda da Quadra" },
  description: "Horários livres e reservas da quadra de futsal.",
  applicationName: "Agenda da Quadra",
  appleWebApp: { capable: true, title: "Quadra", statusBarStyle: "default" },
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
