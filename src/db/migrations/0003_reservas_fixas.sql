CREATE TABLE "reservas_fixas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quadra_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"dia_semana" smallint NOT NULL,
	"horario" time NOT NULL,
	"inicio_vigencia" date NOT NULL,
	"fim_vigencia" date,
	"gerada_ate" date NOT NULL,
	"observacoes" text,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservas_fixas_dia_semana_valido" CHECK ("reservas_fixas"."dia_semana" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "reservas" ADD COLUMN "fixa_id" uuid;--> statement-breakpoint
ALTER TABLE "reservas_fixas" ADD CONSTRAINT "reservas_fixas_quadra_id_quadras_id_fk" FOREIGN KEY ("quadra_id") REFERENCES "public"."quadras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas_fixas" ADD CONSTRAINT "reservas_fixas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas_fixas" ADD CONSTRAINT "reservas_fixas_criado_por_usuarios_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservas_fixas_cliente_idx" ON "reservas_fixas" USING btree ("cliente_id");--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_fixa_id_reservas_fixas_id_fk" FOREIGN KEY ("fixa_id") REFERENCES "public"."reservas_fixas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservas_fixa_idx" ON "reservas" USING btree ("fixa_id");--> statement-breakpoint
-- Mesmo padrão das outras tabelas: só o servidor (Drizzle) acessa.
ALTER TABLE "reservas_fixas" ENABLE ROW LEVEL SECURITY;
