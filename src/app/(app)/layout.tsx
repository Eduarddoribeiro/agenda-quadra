import { Suspense } from "react";
import { BarraNavegacao, BarraNavegacaoBase } from "@/components/barra-navegacao";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="pt-seguro mx-auto min-h-dvh max-w-md pb-[calc(4rem+env(safe-area-inset-bottom)+1.5rem)]">
        {children}
      </main>
      <Suspense fallback={<BarraNavegacaoBase pathname={null} />}>
        <BarraNavegacao />
      </Suspense>
    </>
  );
}
