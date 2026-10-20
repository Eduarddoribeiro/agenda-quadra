-- Impede reservas sobrepostas na mesma quadra (ignorando canceladas).
-- btree_gist permite combinar "quadra_id WITH =" com o operador de range "&&" num índice GiST.
CREATE SCHEMA IF NOT EXISTS extensions;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_sem_sobreposicao"
  EXCLUDE USING gist ("quadra_id" WITH =, tstzrange("inicio", "fim", '[)') WITH &&)
  WHERE ("status" = 'confirmada');--> statement-breakpoint

-- O app acessa o banco só pelo servidor (Drizzle, role postgres, que ignora RLS).
-- Ligar RLS sem policies fecha as tabelas para a API pública do Supabase (chave anon/publishable).
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quadras" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reservas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "horarios_funcionamento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bloqueios" ENABLE ROW LEVEL SECURITY;
