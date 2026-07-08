-- Histórico do cliente (PRD 2.8): permite ao cliente autenticado enxergar os
-- PRÓPRIOS agendamentos entre estabelecimentos. Policy adicional (permissiva)
-- somente de SELECT, baseada em `app.current_customer`. Não afeta o isolamento
-- por tenant: a policy "tenant_isolation" continua valendo para o dono, e
-- INSERT/UPDATE/DELETE seguem restritos ao tenant. As policies permissivas são
-- combinadas por OR, então o SELECT enxerga (tenant atual) OU (próprio cliente).
CREATE POLICY "customer_self_read" ON "appointments"
    FOR SELECT
    USING (
      "customer_id" = NULLIF(current_setting('app.current_customer', true), '')::uuid
    );
