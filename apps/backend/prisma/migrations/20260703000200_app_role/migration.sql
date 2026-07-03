-- =====================================================================
-- Papel de aplicação (runtime) — NÃO superusuário, NÃO BYPASSRLS.
-- Ver PRD 2.3 / 8.2 §2.
--
-- Superusuários (como o dono do banco criado pela imagem) BURLAM o RLS mesmo
-- com FORCE. Portanto o app em runtime conecta como `app_user`, que É submetido
-- às policies. As migrações continuam rodando como o papel privilegiado
-- (directUrl), único capaz de CREATE EXTENSION / criar policies / criar papéis.
--
-- Senha 'app' é apenas para dev local/CI; em produção use um segredo real.
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'app' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;

-- Privilégios nas tabelas atuais...
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ...e nas futuras (tabelas criadas por migrações posteriores como o dono).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
