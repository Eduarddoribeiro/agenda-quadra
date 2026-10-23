ALTER TABLE "reservas_fixas" ADD COLUMN IF NOT EXISTS "duracao" smallint DEFAULT 60 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "reservas_fixas" ADD CONSTRAINT "reservas_fixas_duracao_valida" CHECK ("reservas_fixas"."duracao" between 30 and 720);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
