import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authDesativada } from "@/lib/auth-config";

const ROTAS_PUBLICAS = ["/entrar"];

// Renova a sessão do Supabase a cada request e manda para /entrar quem não está logado.
// É uma checagem otimista: as server actions e consultas verificam o usuário de novo.
export async function proxy(request: NextRequest) {
  if (authDesativada) return NextResponse.next();

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGravar) {
          cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          cookiesParaGravar.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);
  const publica = ROTAS_PUBLICAS.some((rota) => request.nextUrl.pathname.startsWith(rota));

  if (!logado && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (logado && publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return resposta;
}

export const config = {
  matcher: [
    // Tudo, menos arquivos estáticos, ícones, manifest e service worker.
    "/((?!_next/static|_next/image|manifest.webmanifest|sw.js|offline.html|icones/|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
