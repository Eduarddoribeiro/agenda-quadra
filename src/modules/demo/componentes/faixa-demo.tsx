import { IconeWhatsApp } from "@/components/icone-whatsapp";
import { WHATSAPP_CONTATO } from "@/lib/demo";
import { linkWhatsApp } from "@/lib/telefone";

/** Aviso fixo no topo da demonstração, com o contato de quem vende o sistema. */
export function FaixaDemo() {
  return (
    <div className="flex items-center gap-3 bg-amarelo-fundo px-4 py-2.5 text-amarelo-tinta">
      {/* Cartão amarelo, igual ao dos bloqueios */}
      <span aria-hidden className="h-5 w-3.5 shrink-0 -rotate-12 rounded-[3px] bg-amarelo shadow-sm" />
      <p className="min-w-0 flex-1 text-xs leading-snug">
        <b className="block text-sm">Demonstração</b>
        Mexa à vontade: os dados voltam ao exemplo a cada hora.
      </p>
      <a
        href={linkWhatsApp(WHATSAPP_CONTATO, "Oi! Testei a demonstração do De Primeira e quero usar na minha quadra.")}
        target="_blank"
        rel="noreferrer"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-whatsapp px-3.5 text-sm font-bold text-sobre-verde outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
      >
        <IconeWhatsApp className="size-4" />
        Quero usar
      </a>
    </div>
  );
}
