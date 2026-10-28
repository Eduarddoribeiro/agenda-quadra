import Link from "next/link";

/** A demonstração não tem login: o botão só abre a agenda de exemplo. */
export function LoginDemo() {
  return (
    <Link
      href="/"
      className="flex h-14 w-full items-center justify-center rounded-full bg-livre text-base font-bold text-sobre-verde outline-none focus-visible:ring-3 focus-visible:ring-white/50"
    >
      Entrar na demonstração
    </Link>
  );
}
