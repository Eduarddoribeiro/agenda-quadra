import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// Todas as datas/horas absolutas são timestamptz (UTC no banco).
// Horários de funcionamento são "hora de parede" em America/Sao_Paulo (tipo time).

export const papelUsuario = pgEnum("papel_usuario", ["dono", "funcionario"]);
export const statusReserva = pgEnum("status_reserva", ["confirmada", "cancelada"]);

export const usuarios = pgTable("usuarios", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  papel: papelUsuario("papel").notNull().default("funcionario"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quadras = pgTable("quadras", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  ativa: boolean("ativa").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientes = pgTable(
  "clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    // Só dígitos, com DDI (ex.: 5547999998888) — pronto para wa.me
    telefone: text("telefone"),
    observacoes: text("observacoes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clientes_nome_idx").on(t.nome)],
);

export const reservas = pgTable(
  "reservas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quadraId: uuid("quadra_id")
      .notNull()
      .references(() => quadras.id),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id),
    inicio: timestamp("inicio", { withTimezone: true }).notNull(),
    fim: timestamp("fim", { withTimezone: true }).notNull(),
    status: statusReserva("status").notNull().default("confirmada"),
    observacoes: text("observacoes"),
    criadoPor: uuid("criado_por").references(() => usuarios.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Preço e pagamento entram aqui no futuro (ver próximos passos no README).
  },
  (t) => [
    check("reservas_fim_depois_inicio", sql`${t.fim} > ${t.inicio}`),
    index("reservas_cliente_idx").on(t.clienteId),
    // A exclusion constraint contra sobreposição está na migration custom
    // (drizzle não modela EXCLUDE USING gist).
  ],
);

// Um dia pode ter mais de um período (ex.: quarta 08:00–18:00 e 18:30–22:30).
export const horariosFuncionamento = pgTable(
  "horarios_funcionamento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quadraId: uuid("quadra_id")
      .notNull()
      .references(() => quadras.id, { onDelete: "cascade" }),
    // 0 = domingo ... 6 = sábado (igual Date.getDay)
    diaSemana: smallint("dia_semana").notNull(),
    abertura: time("abertura").notNull(),
    // Aceita '24:00' para fechar à meia-noite
    fechamento: time("fechamento").notNull(),
  },
  (t) => [
    index("horarios_quadra_dia_idx").on(t.quadraId, t.diaSemana),
    check("horarios_dia_semana_valido", sql`${t.diaSemana} between 0 and 6`),
    check("horarios_fechamento_depois_abertura", sql`${t.fechamento} > ${t.abertura}`),
  ],
);

export const bloqueios = pgTable(
  "bloqueios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quadraId: uuid("quadra_id")
      .notNull()
      .references(() => quadras.id, { onDelete: "cascade" }),
    inicio: timestamp("inicio", { withTimezone: true }).notNull(),
    fim: timestamp("fim", { withTimezone: true }).notNull(),
    motivo: text("motivo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("bloqueios_fim_depois_inicio", sql`${t.fim} > ${t.inicio}`),
    index("bloqueios_quadra_periodo_idx").on(t.quadraId, t.inicio, t.fim),
  ],
);

export type Quadra = typeof quadras.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Reserva = typeof reservas.$inferSelect;
export type HorarioFuncionamento = typeof horariosFuncionamento.$inferSelect;
export type Bloqueio = typeof bloqueios.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
