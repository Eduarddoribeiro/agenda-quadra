// Modo demonstração: uma cópia separada do sistema (outro banco, outro deploy) com dados
// fictícios que voltam ao exemplo toda madrugada. DESLIGA O LOGIN: nunca ligar no deploy
// do Krahe (o db/index.ts recusa subir em modo demo apontando para o Supabase).
export const modoDemo = process.env.NEXT_PUBLIC_MODO_DEMO === "1";

/** WhatsApp de quem vende o sistema (só dígitos, com DDI). */
export const WHATSAPP_CONTATO = process.env.NEXT_PUBLIC_DEMO_WHATSAPP ?? "5551995859273";

export const marca = modoDemo
  ? {
      nome: "De Primeira",
      nomeCurto: "De Primeira",
      descricao: "Demonstração do De Primeira: a agenda da sua quadra no celular.",
    }
  : {
      nome: "Ginásio Krahe",
      nomeCurto: "Krahe",
      descricao: "Agenda da quadra do Ginásio Krahe.",
    };
