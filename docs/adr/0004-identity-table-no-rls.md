# ADR 0004 — Tabela de usuários como identidade de plataforma (sem RLS)

**Status:** Aceito · **Data:** 2026-07-03

## Contexto

O padrão do projeto (ADR 0002) é: toda tabela de negócio tem `tenant_id` + RLS.
Porém a autenticação precisa buscar um usuário **por e-mail, sem contexto de
tenant** (no login o tenant ainda é desconhecido). Além disso, `CUSTOMER` e
`SUPER_ADMIN` são identidades de plataforma, sem tenant.

## Decisão

- `users` e `refresh_tokens` são tratadas como **tabelas de identidade**, não de
  negócio. **Não** recebem RLS forçado.
- `users.tenant_id` é anulável:
  - `SUPER_ADMIN` / `CUSTOMER` → `NULL`;
  - `TENANT_ADMIN` / `PROFESSIONAL` → id do estabelecimento.
- O escopo por tenant dos usuários de **staff** (ex.: um dono listar seus
  profissionais) é aplicado na **camada de aplicação** com filtro explícito por
  `tenantId`, extraído do JWT.
- Tokens:
  - **access**: JWT curto (15 min) com claims `sub`, `role`, `tenantId`;
  - **refresh**: token opaco aleatório, guardado como **HMAC-SHA256** em
    `refresh_tokens`, com **rotação** a cada uso e revogação no logout.

## Consequências

- (+) Login/refresh funcionam sem contexto de tenant.
- (+) Um mesmo e-mail é único globalmente (evita colisão entre verticais).
- (−) A proteção de listagens de staff depende de disciplina na aplicação (filtro
  por `tenantId`); mitigado por testes e por code review. As tabelas de negócio
  de verdade (agenda, serviços) seguem com RLS a partir da Etapa 1.2.
