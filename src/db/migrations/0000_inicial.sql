CREATE TYPE "public"."papel_usuario" AS ENUM('dono', 'funcionario');--> statement-breakpoint
CREATE TYPE "public"."status_reserva" AS ENUM('confirmada', 'cancelada');--> statement-breakpoint
CREATE TABLE "bloqueios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quadra_id" uuid NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone NOT NULL,
	"motivo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bloqueios_fim_depois_inicio" CHECK ("bloqueios"."fim" > "bloqueios"."inicio")
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "horarios_funcionamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quadra_id" uuid NOT NULL,
	"dia_semana" smallint NOT NULL,
	"abertura" time NOT NULL,
	"fechamento" time NOT NULL,
	CONSTRAINT "horarios_quadra_dia_unq" UNIQUE("quadra_id","dia_semana"),
	CONSTRAINT "horarios_dia_semana_valido" CHECK ("horarios_funcionamento"."dia_semana" between 0 and 6),
	CONSTRAINT "horarios_fechamento_depois_abertura" CHECK ("horarios_funcionamento"."fechamento" > "horarios_funcionamento"."abertura")
);
--> statement-breakpoint
CREATE TABLE "quadras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quadra_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone NOT NULL,
	"status" "status_reserva" DEFAULT 'confirmada' NOT NULL,
	"observacoes" text,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservas_fim_depois_inicio" CHECK ("reservas"."fim" > "reservas"."inicio")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"papel" "papel_usuario" DEFAULT 'funcionario' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bloqueios" ADD CONSTRAINT "bloqueios_quadra_id_quadras_id_fk" FOREIGN KEY ("quadra_id") REFERENCES "public"."quadras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios_funcionamento" ADD CONSTRAINT "horarios_funcionamento_quadra_id_quadras_id_fk" FOREIGN KEY ("quadra_id") REFERENCES "public"."quadras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_quadra_id_quadras_id_fk" FOREIGN KEY ("quadra_id") REFERENCES "public"."quadras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_criado_por_usuarios_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bloqueios_quadra_periodo_idx" ON "bloqueios" USING btree ("quadra_id","inicio","fim");--> statement-breakpoint
CREATE INDEX "clientes_nome_idx" ON "clientes" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "reservas_cliente_idx" ON "reservas" USING btree ("cliente_id");