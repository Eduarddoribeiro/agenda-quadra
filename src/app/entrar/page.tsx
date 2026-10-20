import type { Metadata, Viewport } from "next";
import Image from "next/image";
import logo from "./logo.webp";
import { modoDemo } from "@/lib/demo";
import { FormularioLogin } from "./formulario-login";
import { LoginDemo } from "./login-demo";

export const metadata: Metadata = { title: "Entrar" };

// Fundo preto igual ao do escudo, inclusive na barra do navegador.
export const viewport: Viewport = { themeColor: "#000000" };

export default function PaginaEntrar() {
  if (modoDemo) return <EntrarDemo />;

  return (
    <div className="min-h-dvh bg-black text-white">
      <main className="pt-seguro pb-seguro mx-auto flex min-h-dvh max-w-md flex-col px-6">
        <Image
          src={logo}
          alt="Ginásio do Krahe, Viamão RS"
          priority
          sizes="(max-width: 448px) 72vw, 320px"
          className="mx-auto mt-6 w-[72%] max-w-80"
        />

        <h1 className="font-placar mt-2 text-center text-[2.5rem] leading-none">Agenda da quadra</h1>
        <p className="mt-2 text-center text-white/60">Entre para ver os horários e marcar jogos.</p>

        <div className="mt-8 pb-10">
          <FormularioLogin />
        </div>
      </main>
    </div>
  );
}

function EntrarDemo() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <main className="pt-seguro pb-seguro mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
        <p className="text-center text-sm font-bold tracking-[0.12em] text-white/60 uppercase">Demonstração</p>
        <h1 className="font-placar mt-3 text-center text-[4.5rem] leading-none uppercase">
          De <span className="text-livre">Primeira</span>
        </h1>
        <p className="mt-4 text-center text-white/70">
          Uma quadra de exemplo, com reservas de verdade para você mexer à vontade. A cada hora os dados voltam ao
          começo.
        </p>

        <div className="mt-10">
          <LoginDemo />
        </div>
      </main>
    </div>
  );
}
