import Image from "next/image";
import { cn } from "@/lib/utils";
import { modoDemo } from "@/lib/demo";
import logo from "@/app/entrar/logo.webp";

/**
 * Escudo do ginásio ao lado do título de cada tela. Fica no cabeçalho para o centro da
 * barra de navegação ser o botão de reservar. A demo não leva a marca do Krahe.
 */
export function EscudoCabecalho({ className }: { className?: string }) {
  if (modoDemo) return null;
  return (
    <span aria-hidden className={cn("block size-11 shrink-0 overflow-hidden rounded-full border bg-black", className)}>
      <Image src={logo} alt="" sizes="44px" className="size-full scale-[1.15] object-cover" />
    </span>
  );
}
