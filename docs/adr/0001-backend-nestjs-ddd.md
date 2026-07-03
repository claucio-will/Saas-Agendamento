# ADR 0001 — Backend em NestJS com arquitetura DDD

**Status:** Aceito · **Data:** 2026-07-03

## Contexto

O PRD (seção 3.2) definiu a migração do backend de Java/Spring Boot para NestJS,
unificando a stack em TypeScript (mesmo idioma do frontend Next.js) e permitindo
compartilhar tipos/DTOs no monorepo.

## Decisão

Cada **bounded context** (Identity & Access, Tenant Management, Scheduling,
Catalog, Notifications, Billing) é um **módulo NestJS** com quatro camadas:

```
modules/<contexto>/
  domain/          # entidades, value objects, portas (interfaces). TS puro.
  application/     # casos de uso (use cases). Orquestra o domínio.
  infrastructure/  # adapters: repositórios Prisma, e-mail, storage.
  interface/       # controllers REST (camada de entrada).
```

Regras:

- **`domain/` nunca importa NestJS nem Prisma.** Só TypeScript puro e tipos de
  `@repo/shared`. Isso mantém as regras de negócio testáveis e isoladas.
- Dependências apontam para dentro: `interface → application → domain`;
  `infrastructure` implementa portas declaradas no `domain`.
- A ligação porta→adapter é feita no módulo via provider com token
  (ex.: `{ provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository }`).

O contexto de exemplo implementado na Fase 0 é **Tenant Management**
(`apps/backend/src/modules/tenant`), que serve de molde para os demais.

## Consequências

- (+) Regras de negócio testáveis sem infraestrutura (ver
  `create-tenant.usecase.spec.ts`).
- (+) Troca de ORM/provedor de e-mail sem tocar no domínio.
- (−) Mais arquivos/cerimônia por feature — aceitável pela clareza e testabilidade.
