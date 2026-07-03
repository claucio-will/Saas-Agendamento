# SaaS de Agendamento — Barbearias, Salões e Estúdios de Tatuagem

Plataforma SaaS multi-tenant de agendamento e gestão para estabelecimentos de
beleza e estética. Ver o produto completo em [`docs/PRD-saas-agendamento.md`](docs/PRD-saas-agendamento.md).

> **Status:** Fase 0 (Fundação Técnica) concluída. Próximo: Etapa 1.1 — Identidade e Tenants.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS v4 |
| Backend | NestJS + TypeScript, arquitetura DDD |
| Banco | PostgreSQL + PostGIS, RLS, ORM Prisma |
| Compartilhado | `@repo/shared` (enums + DTOs Zod) |
| Infra local | Docker Compose (Postgres + Redis) |

## Estrutura do monorepo

```
apps/
  backend/    # NestJS — API (bounded contexts DDD)
  frontend/   # Next.js — web (design system + páginas)
packages/
  shared/         # @repo/shared — tipos, enums e schemas Zod
  ui/             # componentes utilitários do turborepo
  eslint-config/  # config ESLint compartilhada
  typescript-config/
docs/
  PRD-saas-agendamento.md
  adr/            # Architecture Decision Records
docker-compose.yml
```

## Pré-requisitos

- Node.js ≥ 20 (testado com 24)
- Docker + Docker Compose
- npm 11

## Setup (primeira vez)

```bash
# 1. Instalar dependências
npm install

# 2. Subir Postgres (PostGIS) + Redis. Postgres é exposto na porta 5433 do host.
docker compose up -d

# 3. Configurar env do backend
cp apps/backend/.env.example apps/backend/.env

# 4. Gerar o Prisma Client e aplicar as migrações (cria tabelas, RLS e app_user)
npm run db:generate --workspace backend
npm run db:deploy   --workspace backend

# 5. (opcional) Popular dados de exemplo
npm run db:seed --workspace backend
```

## Desenvolvimento

```bash
npm run dev        # sobe backend (:4000) e frontend (:3000) via turbo
```

- API: <http://localhost:4000/api> — health em `/api/health`.
- Web: <http://localhost:3000> — vitrine do design system (light/dark).

## Scripts (raiz)

| Comando | O quê |
|---|---|
| `npm run build` | Build de todos os pacotes/apps |
| `npm run lint` | ESLint em todo o monorepo |
| `npm run check-types` | `tsc --noEmit` em todos |
| `npm test` | Testes unitários (sem banco) |

Backend (`--workspace backend`): `db:migrate`, `db:deploy`, `db:seed`,
`db:studio`, `test:e2e` (teste de isolamento — **requer Postgres**).

## Multi-tenancy (leitura obrigatória)

O isolamento entre tenants é garantido por **Row-Level Security** no Postgres +
um papel de aplicação não-privilegiado. Detalhes e o "porquê" em
[`docs/adr/0002-multitenancy-rls.md`](docs/adr/0002-multitenancy-rls.md). Regra
de ouro: **todo acesso a tabela de negócio passa por
`PrismaService.runWithTenant(tenantId, ...)`** e o `tenantId` vem do JWT, nunca
do cliente.

## Testes e CI

- `npm test` — unitários do domínio (rodam sem banco).
- `npm run test:e2e --workspace backend` — **teste de isolamento cross-tenant**
  contra Postgres real (requisito crítico do PRD).
- CI (`.github/workflows/ci.yml`): sobe Postgres+Redis, roda build, lint,
  type-check, migrações e o teste de isolamento a cada push/PR.

## Decisões de arquitetura (ADRs)

- [0001 — Backend NestJS + DDD](docs/adr/0001-backend-nestjs-ddd.md)
- [0002 — Multi-tenancy com RLS](docs/adr/0002-multitenancy-rls.md)
- [0003 — Pacote de tipos compartilhado](docs/adr/0003-shared-types-package.md)
