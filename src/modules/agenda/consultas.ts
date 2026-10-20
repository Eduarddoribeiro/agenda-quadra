import "server-only";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { bloqueios, clientes, horariosFuncionamento, quadras, reservas } from "@/db/schema";
import { diaDaSemana, instanteSP, somarDias, type DataISO } from "@/lib/datas";
import { calcularSlots, type BloqueioNoSlot, type ReservaNoSlot, type Slot } from "./slots";

export async function getQuadraPrincipal() {
  const quadra = await db.query.quadras.findFirst({
    where: eq(quadras.ativa, true),
    orderBy: asc(quadras.createdAt),
  });
  if (!quadra) throw new Error("Nenhuma quadra ativa. Rode `npm run db:seed`.");
  return quadra;
}

async function buscarOcupacao(quadraId: string, de: Date, ate: Date) {
  const [listaReservas, listaBloqueios] = await Promise.all([
    db
      .select({
        id: reservas.id,
        inicio: reservas.inicio,
        fim: reservas.fim,
        observacoes: reservas.observacoes,
        clienteId: clientes.id,
        clienteNome: clientes.nome,
        clienteTelefone: clientes.telefone,
      })
      .from(reservas)
      .innerJoin(clientes, eq(clientes.id, reservas.clienteId))
      .where(
        and(
          eq(reservas.quadraId, quadraId),
          eq(reservas.status, "confirmada"),
          lt(reservas.inicio, ate),
          gt(reservas.fim, de),
        ),
      )
      .orderBy(asc(reservas.inicio)),
    db
      .select({ id: bloqueios.id, inicio: bloqueios.inicio, fim: bloqueios.fim, motivo: bloqueios.motivo })
      .from(bloqueios)
      .where(and(eq(bloqueios.quadraId, quadraId), lt(bloqueios.inicio, ate), gt(bloqueios.fim, de))),
  ]);
  return { reservas: listaReservas satisfies ReservaNoSlot[], bloqueios: listaBloqueios satisfies BloqueioNoSlot[] };
}

export type AgendaDia = { data: DataISO; aberto: boolean; slots: Slot[] };

/** Slots de vários dias seguidos, com uma consulta só ao banco. */
export async function getAgenda(dataInicial: DataISO, dias: number, agora = new Date()): Promise<AgendaDia[]> {
  const quadra = await getQuadraPrincipal();
  // Funcionamento vai no máximo até 24:00, então o intervalo cobre todos os slots.
  const de = instanteSP(dataInicial, "00:00");
  const ate = instanteSP(somarDias(dataInicial, dias), "00:00");

  const [horarios, ocupacao] = await Promise.all([
    db.query.horariosFuncionamento.findMany({ where: eq(horariosFuncionamento.quadraId, quadra.id) }),
    buscarOcupacao(quadra.id, de, ate),
  ]);

  return Array.from({ length: dias }, (_, i) => {
    const data = somarDias(dataInicial, i);
    const horario = horarios.find((h) => h.diaSemana === diaDaSemana(data)) ?? null;
    return {
      data,
      aberto: horario !== null,
      slots: calcularSlots({ data, funcionamento: horario, ...ocupacao, agora }),
    };
  });
}

export async function getAgendaDia(data: DataISO, agora = new Date()): Promise<AgendaDia> {
  const [dia] = await getAgenda(data, 1, agora);
  return dia;
}
