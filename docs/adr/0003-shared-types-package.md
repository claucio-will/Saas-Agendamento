# ADR 0003 — Pacote de tipos/DTOs compartilhado (`@repo/shared`)

**Status:** Aceito · **Data:** 2026-07-03

## Contexto

O PRD (8.2 §6) exige que DTOs de request/response e enums vivam em
`packages/shared` e sejam importados por `frontend` e `backend`, com validação
Zod nos dois lados.

## Decisão

- `@repo/shared` exporta **enums** (papéis, tipos de estabelecimento, status),
  **schemas Zod** e os **tipos inferidos** (`z.infer`) como fonte única de verdade.
- O pacote é **pré-compilado com `tsup`** para `dist` (ESM `.mjs` + CJS `.js` +
  `.d.ts`), com `exports` condicionais. Isso o torna consumível de forma robusta
  por três ambientes distintos:
  - **NestJS** (CommonJS, `require` → `dist/index.js`);
  - **Next.js** (bundler, `import` → `dist/index.mjs`);
  - **Jest/ts-jest** (tipos → `dist/index.d.ts`).
- No Turborepo, `check-types`, `build` e `test` declaram `dependsOn: ["^build"]`,
  garantindo que `@repo/shared` seja compilado antes de qualquer consumidor.

## Alternativas descartadas

- **Exportar TS cru** (padrão "internal packages" do Turborepo): funciona no
  Next (transpilePackages) mas quebra no `tsc` do Nest (resolução de `.js`↔`.ts`
  entre pacotes com `moduleResolution` diferentes). Pré-compilar elimina o atrito.

## Consequências

- (+) Uma mudança de contrato (ex.: novo campo em `CreateTenantDto`) reflete em
  ambos os lados com erro de tipo imediato.
- (−) `@repo/shared` precisa estar buildado para dev (`turbo dev` roda o
  `tsup --watch` do pacote em paralelo).
