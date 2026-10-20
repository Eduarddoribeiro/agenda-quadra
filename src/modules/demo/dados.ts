// Dados fictícios da demonstração, sempre montados em volta do dia de hoje
// para a agenda parecer viva. Sem "server-only": também roda pelo script (npm run demo).
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { diaDaSemana, hojeSP, instanteSP, somarDias, type DataISO } from "@/lib/datas";
import { datasDoFixo, SEMANAS_INICIAIS } from "@/modules/agenda/recorrencia";

type Db = PostgresJsDatabase<typeof schema>;

const { bloqueios, clientes, horariosFuncionamento, quadras, reservas, reservasFixas } = schema;

// Seg–sex com pausa à tarde (mostra vários períodos por dia), sábado corrido, domingo de manhã.
const FUNCIONAMENTO: Record<number, [string, string][]> = {
  0: [["09:00", "13:00"]],
  1: [["08:00", "12:00"], ["17:00", "23:00"]],
  2: [["08:00", "12:00"], ["17:00", "23:00"]],
  3: [["08:00", "12:00"], ["17:00", "23:00"]],
  4: [["08:00", "12:00"], ["17:00", "23:00"]],
  5: [["08:00", "12:00"], ["17:00", "23:00"]],
  6: [["08:00", "22:00"]],
};

const CLIENTES = [
  "Escolinha Bom de Bola (Sub-11)",
  "Pelada dos Amigos (Rodrigo)",
  "Futsal Feminino (Camila)",
  "Pelada da Firma (Márcio)",
  "Turma do Sábado (Paulo)",
  "Lucas Andrade",
  "Felipe Costa",
  "Gustavo Ribeiro",
  "Matheus Oliveira",
  "André Souza",
  "Leandro Pereira",
  "Vinícius Lima",
  "Juliana Martins",
  "Bruno Carvalho",
  "Thiago Rocha",
  "Ricardo Almeida",
  "Daniel Barbosa",
  "Igor Fernandes",
  "Patrícia Gomes",
  "Henrique Dias",
] as const;

// [cliente, dia da semana, horário, observação]
const FIXOS: [number, number, string, string | null][] = [
  [0, 2, "18:00", "Treino das crianças"],
  [0, 4, "18:00", "Treino das crianças"],
  [1, 3, "20:00", null],
  [2, 1, "19:00", null],
  [3, 5, "20:00", "Jogam toda sexta"],
  [4, 6, "10:00", null],
];

const OBSERVACOES = ["Aniversário", "Trazem as próprias bolas", "Confirmar no dia", "Primeira vez na quadra", null];

/** Quantos dias para trás a demo tem histórico. */
const DIAS_PASSADOS = 28;
/** Quantos dias à frente as reservas avulsas vão. */
const DIAS_FUTUROS = 13;

// Gerador pseudoaleatório com semente: a agenda muda de um dia para o outro, mas um
// mesmo dia sempre sai igual.
function aleatorio(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function horasDoDia(data: DataISO): number[] {
  return FUNCIONAMENTO[diaDaSemana(data)].flatMap(([abertura, fechamento]) => {
    const horas: number[] = [];
    for (let h = Number(abertura.slice(0, 2)); h + 1 <= Number(fechamento.slice(0, 2)); h++) horas.push(h);
    return horas;
  });
}

function chanceDeReserva(data: DataISO, hora: number, passado: boolean): number {
  const fimDeSemana = [0, 6].includes(diaDaSemana(data));
  const base = hora >= 18 ? 0.75 : fimDeSemana ? 0.55 : 0.15;
  // Mais longe no futuro, menos reservas feitas (como na vida real).
  return passado ? base : base * 0.85;
}

const hh = (hora: number) => `${String(hora).padStart(2, "0")}:00`;

/** Chave do advisory lock: dois resets ao mesmo tempo não se atropelam. */
const TRAVA_RESET = 4_150_001;

/**
 * Apaga tudo e recria a quadra de exemplo. `telefone` vai em todos os clientes:
 * assim o botão de WhatsApp da demo abre conversa com quem vende o sistema, nunca com um estranho.
 * Com `somenteSeAntesDe`, só reseta se o último reset foi antes desse instante.
 * Devolve se resetou (não reseta se outro reset estiver rodando).
 */
export async function resetarDemo(
  db: Db,
  telefone: string,
  opcoes: { somenteSeAntesDe?: Date } = {},
): Promise<boolean> {
  const hoje = hojeSP();
  const sorteio = aleatorio(Number(hoje.replaceAll("-", "")));

  return db.transaction(async (tx) => {
    const [{ livre }] = await tx.execute<{ livre: boolean }>(sql`select pg_try_advisory_xact_lock(${TRAVA_RESET}) as livre`);
    if (!livre) return false;

    if (opcoes.somenteSeAntesDe) {
      // Os clientes de exemplo nascem no reset: o mais antigo marca quando foi o último.
      const [{ desde }] = await tx.execute<{ desde: string | Date | null }>(
        sql`select min(${clientes.createdAt}) as desde from ${clientes}`,
      );
      if (desde && new Date(desde) >= opcoes.somenteSeAntesDe) return false;
    }

    await tx.delete(reservas);
    await tx.delete(reservasFixas);
    await tx.delete(bloqueios);
    await tx.delete(clientes);
    await tx.delete(horariosFuncionamento);

    let [quadra] = await tx.select({ id: quadras.id }).from(quadras).limit(1);
    if (!quadra) [quadra] = await tx.insert(quadras).values({ nome: "Quadra 1" }).returning({ id: quadras.id });
    await tx.update(quadras).set({ nome: "Quadra 1", ativa: true });

    await tx.insert(horariosFuncionamento).values(
      Object.entries(FUNCIONAMENTO).flatMap(([dia, periodos]) =>
        periodos.map(([abertura, fechamento]) => ({ quadraId: quadra.id, diaSemana: Number(dia), abertura, fechamento })),
      ),
    );

    const ids = (
      await tx
        .insert(clientes)
        .values(CLIENTES.map((nome) => ({ nome, telefone })))
        .returning({ id: clientes.id })
    ).map((c) => c.id);

    // Cartões amarelos: manutenção daqui a 2 dias à noite e um torneio fechando o 6º dia.
    const diaManutencao = somarDias(hoje, 2);
    const diaTorneio = somarDias(hoje, 6);
    const listaBloqueios = [
      { inicio: instanteSP(diaManutencao, "21:00"), fim: instanteSP(diaManutencao, "23:00"), motivo: "Manutenção da rede" },
      { inicio: instanteSP(diaTorneio, "00:00"), fim: instanteSP(somarDias(diaTorneio, 1), "00:00"), motivo: "Torneio interno" },
    ];
    await tx.insert(bloqueios).values(listaBloqueios.map((b) => ({ ...b, quadraId: quadra.id })));
    const bloqueado = (inicio: Date) => listaBloqueios.some((b) => inicio >= b.inicio && inicio < b.fim);

    const ocupados = new Set<string>();
    const novasReservas: (typeof reservas.$inferInsert)[] = [];

    // Horários fixos: geram as semanas passadas (histórico) e as próximas 12, como o app faz.
    const inicioVigencia = somarDias(hoje, -DIAS_PASSADOS);
    const geradaAte = somarDias(hoje, SEMANAS_INICIAIS * 7);
    for (const [cliente, diaSemana, horario, observacoes] of FIXOS) {
      const [fixa] = await tx
        .insert(reservasFixas)
        .values({ quadraId: quadra.id, clienteId: ids[cliente], diaSemana, horario, inicioVigencia, geradaAte, observacoes })
        .returning({ id: reservasFixas.id });
      const datas = datasDoFixo({ diaSemana, inicioVigencia, fimVigencia: null, geradaAte: somarDias(inicioVigencia, -1), ate: geradaAte });
      for (const data of datas) {
        const inicio = instanteSP(data, horario);
        if (bloqueado(inicio)) continue;
        ocupados.add(inicio.toISOString());
        novasReservas.push({
          quadraId: quadra.id,
          clienteId: ids[cliente],
          inicio,
          fim: new Date(inicio.getTime() + 3_600_000),
          observacoes,
          fixaId: fixa.id,
        });
      }
    }

    // Reservas avulsas: noites cheias, manhãs vazias. Hoje sempre sobra horário à noite
    // para dar para testar o "Reservar" na hora.
    for (let d = -DIAS_PASSADOS; d <= DIAS_FUTUROS; d++) {
      const data = somarDias(hoje, d);
      for (const hora of horasDoDia(data)) {
        const inicio = instanteSP(data, hh(hora));
        const chave = inicio.toISOString();
        if (ocupados.has(chave) || bloqueado(inicio)) continue;
        if (d === 0 && (hora === 18 || hora === 21)) continue;
        if (sorteio() >= chanceDeReserva(data, hora, d < 0)) continue;

        // Os 5 primeiros clientes são os fixos; os avulsos saem do resto.
        const cliente = 5 + Math.floor(sorteio() * (CLIENTES.length - 5));
        const obs = sorteio() < 0.15 ? OBSERVACOES[Math.floor(sorteio() * OBSERVACOES.length)] : null;
        ocupados.add(chave);
        novasReservas.push({
          quadraId: quadra.id,
          clienteId: ids[cliente],
          inicio,
          fim: new Date(inicio.getTime() + 3_600_000),
          observacoes: obs,
          // Algumas desmarcadas no passado, para o histórico do cliente mostrar cancelamentos.
          status: d < 0 && sorteio() < 0.08 ? "cancelada" : "confirmada",
        });
      }
    }

    for (let i = 0; i < novasReservas.length; i += 200) {
      await tx.insert(reservas).values(novasReservas.slice(i, i + 200));
    }
    return true;
  });
}
