# PRD — Plataforma SaaS de Agendamento para Barbearias, Salões e Estúdios de Tatuagem

**Versão:** 1.0
**Data:** Julho/2026
**Status:** Rascunho para validação

---

## 1. Visão Geral

### 1.1 Resumo do Produto
Plataforma SaaS multi-tenant de agendamento e gestão para estabelecimentos de beleza e estética pessoal. O sistema atende três segmentos no lançamento — **barbearias**, **salões de cabeleireiro** e **estúdios de tatuagem** — com cadastro e campos personalizados por tipo de estabelecimento.

O modelo de negócio é de **assinatura mensal (subscription)** cobrada de cada estabelecimento (tenant) cadastrado na plataforma.

### 1.2 Problema
Pequenos e médios estabelecimentos de beleza gerenciam agendamentos por WhatsApp manual, caderno ou planilhas, o que gera:
- Conflitos de horário e overbooking;
- Alto índice de no-show (cliente esquece e não comparece);
- Falta de histórico e dados sobre clientes;
- Nenhum canal estruturado de marketing/promoções.

### 1.3 Proposta de Valor
- Agenda online 24/7 para os clientes finais, com descoberta de estabelecimentos próximos;
- Lembretes automáticos por e-mail no MVP (WhatsApp em fase futura), reduzindo no-show;
- Gestão centralizada de serviços, profissionais e horários;
- Campos e fluxos adaptados a cada segmento (barbearia ≠ estúdio de tatuagem);
- Reputação via avaliações de clientes.

### 1.4 Personas
| Persona | Descrição | Objetivo principal |
|---|---|---|
| **Super Admin (Anthropic da plataforma)** | Equipe interna do SaaS | Gerenciar tenants, planos, cobrança e saúde da plataforma |
| **Dono do Estabelecimento (Tenant Admin)** | Proprietário da barbearia/salão/estúdio | Gerenciar agenda, profissionais, serviços e clientes |
| **Profissional/Colaborador** | Barbeiro, cabeleireiro, tatuador | Visualizar e gerenciar sua própria agenda |
| **Cliente Final** | Consumidor que agenda o serviço | Agendar, remarcar e receber lembretes |

---

## 2. Escopo Funcional

### 2.1 Cadastro de Estabelecimento (Onboarding do Tenant)
- Fluxo de cadastro self-service com seleção do **tipo de estabelecimento**: Barbearia, Salão de Cabeleireiro ou Estúdio de Tatuagem.
- Formulário dinâmico com **campos personalizados por tipo**:

| Campo | Barbearia | Salão | Estúdio de Tatuagem |
|---|---|---|---|
| Dados básicos (nome, CNPJ/CPF, endereço, telefone) | ✔ | ✔ | ✔ |
| Serviços padrão sugeridos | Corte, barba, sobrancelha, pigmentação | Corte, coloração, escova, hidratação, manicure | Tatuagem por sessão, orçamento por tamanho/estilo, retoque |
| Duração média do serviço | 30–60 min | 30 min–4 h | 1 h–8 h (sessões) |
| Campos extras | — | Ficha de coloração/química | Termo de consentimento, ficha de anamnese (alergias, saúde), portfólio do tatuador, sinal/depósito obrigatório |
| Precificação | Preço fixo | Preço fixo ou "a partir de" | Orçamento sob consulta + sinal |

- Modelagem de "tipo de estabelecimento" deve ser **extensível** para novos verticais no futuro (ex.: estética, podologia) sem mudança estrutural.

### 2.2 Autenticação e Autorização
- Tela de login (e-mail + senha) com JWT (access token + refresh token).
- Cadastro de usuário, recuperação de senha por e-mail, verificação de e-mail.
- RBAC com papéis: `SUPER_ADMIN`, `TENANT_ADMIN`, `PROFESSIONAL`, `CUSTOMER`.
- Todo token JWT carrega o `tenant_id` (exceto Super Admin) e as claims de papel.
- **Login social com Google (Gmail)** via OAuth 2.0 para o cliente final — requisito obrigatório, além do login por e-mail/senha.
- **Autenticação sob demanda:** o cliente navega por toda a área pública **sem login**; a autenticação só é exigida no momento de **confirmar um agendamento** (o contexto do agendamento em andamento é preservado após login/cadastro, sem perder a seleção de serviço/horário).
- **Sugestões adicionais:** 2FA opcional para admins; rate limiting em endpoints de autenticação.

### 2.3 Multi-tenancy e Isolamento
- **Requisito crítico:** isolamento 100% entre tenants. Nenhum dado de um tenant pode ser lido/escrito por outro.
- Estratégia recomendada: banco compartilhado com coluna `tenant_id` em todas as tabelas de negócio + **Row-Level Security (RLS) no PostgreSQL** como camada de defesa em profundidade, além do filtro obrigatório na camada de aplicação.
- `tenant_id` resolvido a partir do JWT em todas as requisições; nunca aceito via parâmetro do cliente.
- Cada tenant pode ter subdomínio ou slug próprio (ex.: `barbearia-do-ze.plataforma.com` ou `/b/barbearia-do-ze`) para a página pública de agendamento.
- Testes automatizados de isolamento (tentativas de cross-tenant access) obrigatórios no CI.

### 2.4 Área do Super Admin (Plataforma)
**Escopo MVP (versão enxuta):**
- Listagem/busca de tenants com detalhes (plano, status de pagamento, data de cadastro, tipo).
- Ativar, suspender e cancelar tenants.
- Moderação de avaliações denunciadas.

**Pós-MVP:**
- Dashboard completo: total de tenants, ativos, inadimplentes, churn, MRR, novos cadastros, agendamentos totais, uso de mensagens.
- Gestão de planos e preços pela interface (no MVP, planos configurados direto no gateway/banco).
- Logs de auditoria com interface de consulta.

### 2.5 Área do Dono do Estabelecimento (Tenant Admin)
- Dashboard: agendamentos do dia/semana, faturamento estimado, taxa de no-show, novos clientes.
- **Agenda** (visão diária, semanal e por profissional) com criação, edição, remarcação e cancelamento de horários.
- Cadastro de **serviços** (nome, duração, preço, profissionais habilitados).
- Cadastro de **profissionais** com horários de trabalho, folgas e bloqueios de agenda.
- Cadastro e listagem de **clientes**: quem está agendado, histórico de atendimentos, contato.
- Configuração de horário de funcionamento, intervalo entre atendimentos e antecedência mínima/máxima para agendar.
- Configuração de mensagens automáticas (templates de lembrete e confirmação).
- Gestão da assinatura do próprio tenant (plano, fatura, forma de pagamento).
- **Sugestões adicionais:** relatórios (serviços mais vendidos, desempenho por profissional), programa de fidelidade simples (ex.: 10º corte grátis), controle básico de caixa/comandas.

### 2.6 Área do Profissional
- Visualização da própria agenda (dia/semana).
- Marcar atendimento como concluído / cliente não compareceu.
- Bloquear horários próprios (almoço, imprevistos).

### 2.7 Descoberta Pública de Estabelecimentos (Home do Cliente)
**Fluxo de entrada de um novo usuário:** ao acessar a plataforma, o visitante cai em uma **tela inicial pública (sem login)** que lista os estabelecimentos cadastrados **próximos à sua localização**.

- **Geolocalização:** solicitação de permissão de localização do navegador (Geolocation API); em caso de negação, fallback para busca por cidade/CEP digitado.
- Listagem ordenada por proximidade, com nome, tipo (barbearia/salão/estúdio), foto, avaliação, distância e faixa de preço.
- **Filtros:** tipo de estabelecimento, serviço desejado, distância e disponibilidade.
- **Categorias de serviço na home [Fase 1]:** grade de ícones clicáveis por categoria (ex.: Cabelos, Barbearia, Sobrancelhas, Depilação, Tatuagem…) que filtra os estabelecimentos que oferecem serviços daquela categoria. As categorias são gerenciadas pela plataforma; cada serviço do tenant é vinculado a uma categoria no cadastro.
- Busca por nome do estabelecimento ou serviço.
- Visualização em lista ordenada por distância (visualização em **mapa** fica para a Fase 2).
- **Compartilhar estabelecimento [Fase 1]:** botão de compartilhar na página do estabelecimento que copia/compartilha o link público (Web Share API no mobile). Essencial, pois o link direto é o principal canal de aquisição.
- **Favoritos [Fase 1]:** cliente logado pode favoritar estabelecimentos (ícone de coração) e acessá-los em uma aba "Favoritos".
- **Navegação 100% sem login:** o visitante pode explorar estabelecimentos, ver serviços, preços, profissionais e horários disponíveis livremente. O **login só é exigido no momento de confirmar o agendamento** (ou ao favoritar).
- Requisitos técnicos: campo de endereço geocodificado (latitude/longitude) no cadastro do tenant; busca geoespacial no PostgreSQL com **PostGIS** (ou earthdistance) para consulta por raio; SSR/SEO nas páginas públicas (Next.js) para os estabelecimentos serem encontrados no Google.
- Cada estabelecimento pode ativar/desativar sua visibilidade na busca pública (alguns podem preferir apenas o link direto).
- **Estratégia de cold start (marketplace vazio):** no lançamento, o principal canal de aquisição do cliente final é o **link/slug direto do estabelecimento** (divulgado pelo próprio dono no Instagram/WhatsApp). A home de descoberta entra no MVP, mas o go-to-market deve focar em **uma cidade/região por vez** para garantir densidade mínima de estabelecimentos antes de expandir. Quando não houver resultados próximos, exibir estado vazio amigável com busca por cidade e CTA para o dono cadastrar seu estabelecimento.

### 2.8 Área do Cliente Final
- Página pública do estabelecimento (link/slug do tenant) com serviços, preços, profissionais e horários disponíveis.
- Fluxo de agendamento: escolher serviço → profissional (opcional "qualquer um") → data/horário → **login/cadastro (apenas neste momento, se ainda não autenticado)** → confirmação.
- Cadastro leve do cliente (nome, telefone/WhatsApp, e-mail) ou **login com Google em um clique**.
- Área logada: meus agendamentos, remarcar, cancelar (respeitando política de antecedência do tenant).
- **Repetir último agendamento [Fase 2]:** atalho na home logada ("Repetir corte no BarberEstillo") que refaz em um clique o último serviço concluído — mesmo estabelecimento, serviço e profissional — indo direto para a escolha de data/horário. Forte alavanca de retenção.
- Recebimento de confirmação e lembretes por **e-mail** (WhatsApp em fase futura).
- **Avaliação pós-atendimento:** após o agendamento ser marcado como concluído, o cliente recebe convite (e-mail) para avaliar com nota de 1–5 estrelas e comentário opcional. A média alimenta a nota exibida na home de descoberta. O dono pode responder avaliações; moderação de conteúdo ofensivo pelo Super Admin.
- **Recomendação por profissional [Fase 2]:** além da nota do estabelecimento, o cliente pode recomendar o profissional que o atendeu; o contador de recomendações aparece na escolha do profissional durante o agendamento.
- **Pacotes/combos [Fase 3]:** o tenant pode montar pacotes de serviços (ex.: corte + barba) com preço promocional, exibidos em aba própria na página do estabelecimento e agendáveis como um único horário com duração somada.
- **Atendimento a domicílio [Fase 3]:** serviços podem ser marcados como "a domicílio"; o cliente informa endereço no agendamento e o tenant define raio de atendimento e taxa de deslocamento. Filtro "no local / a domicílio" na busca.
- Para estúdios de tatuagem: envio de referência/descrição da tatuagem no agendamento e aceite do termo de consentimento.

### 2.9 Agenda de Horários (Motor de Agendamento)
- Cálculo de slots disponíveis com base em: horário de funcionamento, jornada do profissional, duração do serviço, bloqueios e agendamentos existentes.
- Prevenção de conflito/overbooking com lock transacional (concorrência de dois clientes no mesmo slot).
- Estados do agendamento: `PENDENTE` → `CONFIRMADO` → `CONCLUÍDO` / `CANCELADO` / `NO_SHOW`.
- **Cancelamento e remarcação pelo estabelecimento:** o dono/profissional pode cancelar ou remarcar qualquer agendamento (imprevisto, folga), com **notificação automática ao cliente por e-mail** informando o motivo e, no caso de remarcação, o novo horário sugerido.
- Suporte a serviços de longa duração e múltiplas sessões (tatuagem).
- Fuso horário configurável por tenant.

### 2.10 Notificações — E-mail (canal principal do MVP)
- E-mail transacional de: confirmação de agendamento, remarcação, cancelamento, lembrete (ex.: 24 h antes e no dia) e convite de avaliação pós-atendimento.
- Provedor sugerido: Amazon SES, Resend ou SendGrid, atrás de uma abstração (padrão port/adapter do DDD) — a mesma abstração de "Notification Channel" receberá o WhatsApp no futuro sem retrabalho.
- Templates personalizáveis com nome do estabelecimento e dados do agendamento.

### 2.11 Notificações — WhatsApp (FASE FUTURA — fora do MVP)
> ⚠️ **Decisão de produto:** a integração com WhatsApp foi adiada para fase posterior ao MVP. No lançamento, todos os lembretes e confirmações serão por e-mail. A arquitetura de notificações deve ser desenhada com canal plugável para que o WhatsApp entre depois sem refatoração.

Quando implementada:
- Integração com **WhatsApp Business Cloud API (Meta)** — via Meta direta ou BSP (Twilio, Z-API oficial, 360dialog).
- Casos de uso: lembrete no dia do agendamento (com botão de confirmação/cancelamento), promoções/campanhas e confirmação pós-agendamento.
- Templates de mensagem pré-aprovados pela Meta (requisito da API oficial).
- **Opt-in/opt-out obrigatório** do cliente para mensagens promocionais (LGPD e política da Meta).
- Controle de cota/custo por tenant (mensagens incluídas no plano + excedente).

### 2.12 Upload e Gestão de Mídia
- Upload de **logo e fotos do estabelecimento** (obrigatório ao menos 1 foto para aparecer na busca pública) e **foto do profissional**.
- **Portfólio do tatuador** (galeria de trabalhos) para estúdios de tatuagem.
- Armazenamento em object storage (**AWS S3** ou **Cloudflare R2**) com URLs servidas via CDN; nunca no banco de dados.
- Validações: formatos JPEG/PNG/WebP, tamanho máximo por arquivo (ex.: 5 MB), limite de fotos por plano.
- Otimização automática: redimensionamento e conversão para WebP; thumbnails para a listagem de descoberta.
- Upload direto do cliente ao storage via URL pré-assinada (não trafega pelo backend).

### 2.13 Assinatura e Cobrança (Billing)
- Cobrança mensal recorrente por tenant.
- Gateway sugerido: Stripe, Pagar.me ou Asaas (cartão + Pix).
- Planos sugeridos (a validar):
  - **Básico:** 1 profissional, lembretes por e-mail;
  - **Profissional:** até 5 profissionais, relatórios, mais fotos no perfil;
  - **Premium:** profissionais ilimitados, prioridade de suporte (WhatsApp e campanhas entram nestes planos quando a integração for lançada).
- Período de trial (ex.: 14 dias) sem cartão.
- Suspensão automática por inadimplência (com período de carência) e reativação automática após pagamento.
- Webhooks do gateway para atualizar status da assinatura.
- **Aceite obrigatório dos Termos de Uso e do contrato de assinatura** no onboarding, com registro de versão aceita, data/hora e IP.

---

## 3. Requisitos Não Funcionais

### 3.1 Arquitetura e Stack
| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | **NestJS (Node.js + TypeScript)**, arquitetura **DDD** |
| Monorepo | **Turborepo** (já criado — base do projeto) com pacote de tipos/DTOs compartilhado entre frontend e backend |
| Banco de dados | PostgreSQL (com RLS) — ORM: **Prisma** (Prisma Migrate para migrações versionadas) |
| Autenticação | JWT (access + refresh), Passport.js (estratégia local + Google OAuth) |
| Mensageria (recomendado) | Fila assíncrona (BullMQ/Redis) para envio de e-mails e notificações |
| Infra (sugestão) | Docker, CI/CD, ambientes dev/staging/prod |

### 3.2 DDD — Bounded Contexts sugeridos
- **Identity & Access** (usuários, papéis, autenticação);
- **Tenant Management** (estabelecimentos, planos, assinatura);
- **Scheduling** (agenda, slots, agendamentos);
- **Catalog** (serviços, profissionais);
- **Notifications** (e-mail, WhatsApp, templates, campanhas);
- **Billing** (cobrança, faturas, webhooks de pagamento).

Cada contexto vira um **módulo NestJS** com camadas: `domain` (entidades, value objects, agregados, eventos de domínio — classes TypeScript puras, sem dependência do framework), `application` (casos de uso/services), `infrastructure` (repositórios ORM, adapters de e-mail/storage) e `interface` (controllers REST). Comunicação entre contextos via eventos de domínio (EventEmitter/BullMQ) quando possível.

> **Decisão registrada (ADR):** o backend foi migrado de Java/Spring Boot para **NestJS** para unificar a stack em TypeScript (mesmo idioma do frontend Next.js e do ecossistema do time), permitindo compartilhamento de tipos/DTOs em monorepo e reduzindo troca de contexto. A arquitetura DDD e todos os requisitos (RLS, JWT, filas, PostGIS) permanecem inalterados — o NestJS oferece DI, decorators e modularidade equivalentes ao Spring.
>
> **Pontos de atenção específicos do Node:** (1) o lock transacional anti-overbooking deve usar `SELECT ... FOR UPDATE` / constraint de exclusão no Postgres — nunca lock em memória, pois o processo Node escala horizontalmente; (2) trabalho pesado (redimensionamento de imagens, envio em massa) sempre na fila (BullMQ), nunca no event loop da API.

### 3.3 Design e UX
- **Mobile-first**: todo layout projetado primeiro para telas pequenas e totalmente responsivo, preparado para ser embarcado em WebView de um app Android nativo no futuro (evitar dependência de hover, garantir touch targets ≥ 44 px, performance em rede 3G/4G).
- **Tema**: Light mode como padrão, com **Dark mode** alternável por um botão de um clique na interface; preferência persistida por usuário.
- **Paleta elegante** (proposta inicial, a refinar com o time de design):
  - Primária: verde-escuro profundo `#1B4332` ou grafite `#1F2937`;
  - Acento: dourado suave `#C9A227` (transmite sofisticação para os três segmentos);
  - Neutros: off-white `#FAFAF7`, cinzas quentes;
  - Dark mode: fundo `#111827`, superfícies `#1F2937`, mesmo acento dourado.
- Botões elegantes: cantos arredondados consistentes, estados claros (hover, focus visível, disabled, loading), microinterações sutis.
- Acessibilidade: contraste WCAG AA, navegação por teclado, labels em formulários.

### 3.4 Segurança, Privacidade e Jurídico
- Isolamento total entre tenants (aplicação + RLS + testes de segurança).
- Senhas com BCrypt/Argon2; tokens com expiração curta e rotação de refresh token.
- HTTPS obrigatório; headers de segurança (CSP, HSTS).
- **LGPD**: consentimento para comunicações, direito de exclusão de dados do cliente, minimização de dados; ficha de anamnese (tatuagem) tratada como dado sensível de saúde, com criptografia e acesso restrito.
- **Documentos jurídicos obrigatórios para o lançamento:** Termos de Uso da plataforma, Política de Privacidade (LGPD) e contrato de assinatura do tenant — todos versionados, com registro de aceite (usuário, versão, data/hora, IP). Recomenda-se revisão por advogado antes do go-live.
- Auditoria de ações administrativas.

### 3.5 Observabilidade, Backup e Suporte (requisitos de operação)
- **Logs estruturados** (JSON) com `tenant_id` e `trace_id` em todas as requisições; centralização (ex.: CloudWatch, Loki ou Better Stack).
- **Monitoramento de erros** com Sentry (frontend e backend) e alertas de indisponibilidade (health checks + uptime monitor).
- Métricas básicas de aplicação (latência, taxa de erro, fila de notificações) — NestJS Terminus (health) + Prometheus/Grafana ou equivalente gerenciado.
- **Backup automático diário do PostgreSQL** com retenção mínima de 30 dias e **teste de restauração** documentado; point-in-time recovery se o provedor suportar.
- **Canal de suporte ao tenant** desde o dia 1: e-mail de suporte e/ou número de WhatsApp comercial (atendimento humano — não confundir com a integração de API), com SLA simples definido (ex.: resposta em até 24 h úteis).

### 3.6 Performance e Escalabilidade
- P95 de resposta da API < 300 ms nas rotas de agenda.
- Cálculo de disponibilidade otimizado (cache de slots invalidado por evento).
- Envio de notificações assíncrono (fila) para não bloquear requisições.
- Preparado para escala horizontal (backend stateless).

---

## 4. Fora de Escopo do MVP (planejado para fases seguintes)
- **Fase 2:** integração WhatsApp (lembretes), repetir último agendamento, recomendação por profissional, visualização em mapa, dashboard completo do Super Admin, relatórios do tenant;
- **Fase 3:** pacotes/combos, atendimento a domicílio, campanhas WhatsApp, sinal para tatuagem, fidelidade, caixa/comandas;
- **Fase 4:** app Android (WebView), múltiplas filiais, novos verticais, pagamento online completo.

---

## 5. Métricas de Sucesso
- **Negócio:** MRR, nº de tenants ativos, churn mensal < 5%, conversão de trial > 25%.
- **Produto:** taxa de no-show reduzida (meta: −25% com lembretes por e-mail no MVP; −40% após WhatsApp), % de agendamentos feitos pelo cliente sem intervenção do dono, média de avaliações ≥ 4,5, NPS dos tenants.
- **Técnico:** zero incidentes de vazamento cross-tenant, uptime ≥ 99,5%.

---

## 6. Plano de Desenvolvimento em Fases

> Sem pressão de prazo (ainda não há clientes), o plano prioriza **fundação sólida** antes de funcionalidades visíveis. Cada fase só começa quando a anterior atende seu critério de conclusão ("Definition of Done"). As etapas 1.x da Fase 1 são sequenciais; dentro de cada etapa as tarefas podem ser paralelizadas.

### Fase 0 — Fundação Técnica
**Objetivo:** ambiente pronto para desenvolver com qualidade desde o primeiro commit.
- Monorepo **Turborepo já criado** — completar com: app backend NestJS, pacote compartilhado de tipos, Docker Compose local (Postgres + Redis), CI/CD com build, testes e lint.
- Estrutura DDD do backend: bounded contexts, camadas e convenções documentadas (ADRs).
- PostgreSQL com migrações versionadas via **Prisma Migrate**, **RLS configurado desde o início** e `tenant_id` no modelo base.
- Design system inicial no frontend: paleta light/dark, tipografia, componentes base (botões, inputs, cards) com Tailwind — elegância definida aqui, antes de qualquer tela.
- Observabilidade mínima: logs estruturados, Sentry, health checks.

**Done quando:** um endpoint de exemplo passa pelo pipeline completo (CI → deploy em staging) com teste de isolamento de tenant verde.

### Fase 1 — MVP (produto lançável)
**Etapa 1.1 — Identidade e Tenants**
- Cadastro/login (e-mail+senha e Google OAuth), JWT com refresh, RBAC (4 papéis).
- Onboarding do tenant com campos por tipo (barbearia/salão/estúdio) e aceite de termos versionado.
- Super Admin enxuto (listar, ativar, suspender tenants).

**Etapa 1.2 — Catálogo e Agenda (coração do produto)**
- Cadastro de serviços (com categoria), profissionais, jornadas e bloqueios.
- Motor de slots com prevenção de overbooking (testes de concorrência obrigatórios).
- Agenda do dono (dia/semana/por profissional) e do profissional; estados do agendamento; cancelamento/remarcação com notificação.

**Etapa 1.3 — Experiência do Cliente**
- Home pública com geolocalização, categorias de serviço, filtros e busca (lista por distância).
- Página do estabelecimento (fotos, avaliações, serviços, profissionais) com SSR/SEO + botão compartilhar.
- Fluxo de agendamento com login sob demanda (contexto preservado); área "meus agendamentos"; favoritos.
- Upload de mídia (S3/R2 com URL pré-assinada, otimização WebP).

**Etapa 1.4 — Notificações e Avaliações**
- E-mails transacionais via fila assíncrona (confirmação, lembrete 24 h/dia, cancelamento).
- Avaliação pós-atendimento (1–5 estrelas, resposta do dono, moderação).

**Etapa 1.5 — Billing e Go-live**
- Assinatura recorrente (gateway com Pix + cartão), trial de 14 dias, suspensão por inadimplência via webhook.
- Termos de Uso e Política de Privacidade revisados; backup automático com teste de restauração; monitor de uptime.
- **Beta fechado:** 3–5 estabelecimentos reais usando por 2–4 semanas antes da abertura pública.

**Done quando:** um estabelecimento real completa o ciclo inteiro sem intervenção manual — cadastro → configuração → cliente encontra, agenda e recebe lembrete → atendimento concluído → avaliação → mensalidade cobrada.

### Fase 2 — Retenção e Comunicação
- **Integração WhatsApp** (lembretes e confirmações) sobre a abstração de canal já existente.
- **Repetir último agendamento** (atalho de 1 clique na home logada).
- **Recomendação por profissional** exibida na escolha do profissional.
- Visualização em **mapa** na busca; dashboard completo do Super Admin (MRR, churn); relatórios do tenant (serviços mais vendidos, desempenho por profissional, taxa de no-show).

**Done quando:** taxa de no-show cai mensuravelmente com os lembretes por WhatsApp e ≥ 30% dos reagendamentos usam o atalho de repetir.

### Fase 3 — Expansão de Oferta
- **Pacotes/combos** com preço promocional e duração somada.
- **Atendimento a domicílio** (raio, taxa de deslocamento, filtro no local/domicílio).
- Campanhas de promoção via WhatsApp (opt-in/opt-out, cota por plano).
- **Sinal/depósito para tatuagem** (pagamento online do sinal via Pix).
- Programa de fidelidade simples e controle básico de caixa/comandas.

### Fase 4 — Plataforma Madura
- **App Android (WebView)** publicado na Play Store — a interface mobile-first construída desde a Fase 0 é embarcada sem retrabalho.
- Múltiplas unidades (filiais) por tenant.
- Novos verticais (estética, podologia etc.) usando o modelo extensível de tipos.
- Pagamento online completo do serviço pelo cliente.

---

## 6.1 Princípios do Plano
1. **Fundação antes de feature:** isolamento multi-tenant, design system e observabilidade são pré-requisitos, não dívida a pagar depois.
2. **O coração é a agenda:** nada entra em uma fase se comprometer a confiabilidade do motor de agendamento.
3. **Cada fase entrega valor usável:** ao fim da Fase 1 já existe um produto completo e vendável; as fases seguintes ampliam retenção e receita.
4. **Beta com usuários reais antes de escalar:** feedback de estabelecimentos de verdade orienta a priorização da Fase 2 em diante.

---

## 7. Riscos e Mitigações
| Risco | Mitigação |
|---|---|
| Vazamento cross-tenant | RLS no Postgres + filtros obrigatórios + testes automatizados de isolamento |
| Marketplace vazio no lançamento (cold start) | Go-to-market por cidade/região, aquisição via link direto do tenant, estado vazio com CTA de cadastro |
| Retrabalho ao adicionar WhatsApp depois | Abstração de canal de notificação (port/adapter) desde o MVP; e-mail e WhatsApp como adapters do mesmo contrato |
| Overbooking em concorrência | Lock transacional/constraint única no slot |
| Complexidade de campos por vertical | Modelo extensível (tipo de estabelecimento + configuração de campos), evitar hardcode |
| Inadimplência | Suspensão automática com carência + Pix como opção de pagamento |
| Perda de dados | Backup diário com teste de restauração + point-in-time recovery |


---

## 8. Guia de Implementação (instruções para a LLM/agente de código)

> Esta seção é o contrato de execução. O monorepo Turborepo **já existe** — não recriar o scaffold. Implementar sobre a base existente.

### 8.1 Estrutura esperada do monorepo
```
/
├── apps/
│   ├── web/        # Next.js (App Router) — frontend
│   └── api/        # NestJS — backend
├── packages/
│   ├── shared/     # Tipos, DTOs, enums e schemas de validação (Zod) compartilhados
│   ├── ui/         # (opcional) componentes do design system
│   └── config/     # ESLint, TS config e afins compartilhados
├── docker-compose.yml   # Postgres (com PostGIS) + Redis para dev local
└── turbo.json
```
Se a base existente usar nomes diferentes, **adaptar-se aos nomes existentes** em vez de renomear.

### 8.2 Regras de implementação (obrigatórias)
1. **Ordem de execução:** seguir estritamente as fases e etapas da seção 6. Não implementar funcionalidades de fases futuras (marcadas [Fase 2]/[Fase 3]) antecipadamente.
2. **Multi-tenancy inegociável:** toda tabela de negócio tem `tenant_id`; RLS ativo no Postgres com policies por tenant; o `tenant_id` vem exclusivamente do JWT (nunca de body/query/param); todo repositório filtra por tenant; escrever testes automatizados de tentativa de acesso cross-tenant a cada novo módulo.
3. **DDD nos módulos NestJS:** cada bounded context (seção 3.2) é um módulo com pastas `domain/` (classes puras, sem importar Nest ou Prisma), `application/`, `infrastructure/` e `interface/`. Domínio nunca importa infraestrutura.
4. **Prisma:** schema único em `apps/api/prisma/schema.prisma`; toda mudança de schema via `prisma migrate dev` (nunca `db push` fora de experimento local); policies de RLS e extensões (PostGIS) em migrações SQL customizadas.
5. **Concorrência:** reserva de slot com transação + `SELECT ... FOR UPDATE` (via `$transaction` do Prisma com SQL bruto quando necessário) ou constraint de exclusão; jamais lock em memória do processo.
6. **Tipos compartilhados:** DTOs de request/response e enums vivem em `packages/shared` e são importados por `web` e `api`; validação com Zod nos dois lados.
7. **Notificações:** abstração `NotificationChannel` (port) com adapter de e-mail no MVP; envio sempre via fila BullMQ, nunca síncrono na request.
8. **Frontend:** mobile-first; light mode padrão com toggle de dark mode (classe `dark` do Tailwind + persistência); usar tokens do design system definido na Fase 0; nenhuma página pública depende de login.
9. **Qualidade:** testes unitários no domínio (regras de agenda em especial), testes e2e dos fluxos críticos (agendar, cancelar, isolamento de tenant); lint e typecheck passando no CI antes de cada merge.
10. **Segredos e config:** variáveis de ambiente validadas no boot (ex.: `@nestjs/config` + Zod); nunca commitar segredos.

### 8.3 Primeiro prompt sugerido (Fase 0)
Implementar, sobre o monorepo existente: app `api` NestJS com estrutura DDD e módulo de exemplo; `docker-compose.yml` com Postgres+PostGIS e Redis; Prisma configurado com modelo base contendo `Tenant` e RLS ativo; pacote `shared` com primeiro DTO consumido pelo `web`; design system inicial (paleta seção 3.3, light/dark, botão/input/card); CI com lint, typecheck e testes; teste de isolamento de tenant passando. Só então iniciar a Etapa 1.1.
