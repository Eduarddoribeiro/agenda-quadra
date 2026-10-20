# Agenda da Quadra

Webapp (PWA) para o dono da quadra de futsal ver horários livres/ocupados e marcar jogos pelo celular.
Regras de negócio e arquitetura: veja [CLAUDE.md](./CLAUDE.md).

## Rodar sem Supabase (banco local)

```bash
npm install
npm run db:local        # terminal 1: Postgres embutido (PGlite) na porta 5433
npm run db:migrate      # terminal 2
npm run db:seed         # 1 quadra, aberta 08h–23h todos os dias
npm run db:exemplo      # opcional: clientes e reservas fictícios
npm run dev
```

O `.env.local` de desenvolvimento usa `AUTH_DESATIVADA=1`, que pula o login. Essa variável é ignorada em produção.

## Ligar no Supabase

1. Crie o projeto no [Supabase](https://supabase.com) (região **South America (São Paulo)**).
2. Preencha o `.env.local` com os valores do projeto (modelo em `.env.example`) e **remova** `AUTH_DESATIVADA`.
3. Em **Authentication → Sign In / Providers**, desligue *Allow new users to sign up*.
4. Em **Authentication → Users → Add user**, crie o usuário do dono com e-mail e senha.
5. Rode `npm run db:migrate` e `npm run db:seed`.
6. `npm run dev` e entre com o e-mail do dono. O primeiro usuário a entrar vira **dono**, os seguintes **funcionário**.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes (lógica de slots, telefone, texto do WhatsApp e regras do banco) |
| `npm run db:generate` | Gera migration a partir de `src/db/schema.ts` |
| `npm run db:migrate` | Aplica as migrations |
| `npm run db:seed` | Cria a quadra e o horário de funcionamento (idempotente) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:local` | Postgres local (PGlite) para desenvolver sem Supabase |
| `npm run db:exemplo` | Dados fictícios (só roda contra o banco local) |

## Garantias do banco

- `reservas_sem_sobreposicao`: exclusion constraint (`btree_gist` + `tstzrange(inicio, fim, '[)')`) por quadra, ignorando canceladas. Duas reservas confirmadas nunca se sobrepõem, mesmo com cliques simultâneos.
- RLS ligado em todas as tabelas, sem policies. O app acessa o banco só pelo servidor (Drizzle); a API pública do Supabase não lê nada.
- Datas em `timestamptz` (UTC), exibidas em `America/Sao_Paulo`.
