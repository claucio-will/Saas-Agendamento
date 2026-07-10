import { Injectable } from '@nestjs/common';
import type { PlatformOverviewDto } from '@repo/shared';
import { PrismaService } from '../../../infra/prisma/prisma.service';

/**
 * Métricas consolidadas da plataforma para o dashboard do Super Admin.
 *
 * O admin controla as ASSINATURAS — os assinantes são os donos/estabelecimentos
 * que aderiram à plataforma. Ele NÃO enxerga os clientes finais de cada dono
 * (isso é responsabilidade do próprio dono). Aqui só há o engajamento agregado
 * (volume de agendamentos) como sinal de saúde/uso de cada assinante.
 *
 * `tenants`/`users` são tabelas de identidade (não-RLS): consulta direta. O
 * volume de agendamentos é RLS por tenant, então percorre cada tenant dentro de
 * `runWithTenant` (laço ok p/ a escala atual).
 */
@Injectable()
export class PlatformStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<PlatformOverviewDto> {
    const [tenants, owners] = await Promise.all([
      this.prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          establishmentType: true,
          status: true,
          plan: true,
          trialEndsAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.user.findMany({
        where: { role: 'TENANT_ADMIN' },
        select: { name: true, email: true, tenantId: true },
      }),
    ]);

    const ownerByTenant = new Map(
      owners
        .filter((o) => o.tenantId)
        .map((o) => [o.tenantId as string, o]),
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let appointmentsTotal = 0;
    const establishments: PlatformOverviewDto['establishments'] = [];

    for (const t of tenants) {
      const activity = await this.prisma.runWithTenant(t.id, async (tx) => {
        const [count, last] = await Promise.all([
          tx.appointment.count(),
          tx.appointment.findFirst({
            orderBy: { startsAt: 'desc' },
            select: { startsAt: true },
          }),
        ]);
        return { count, lastActivityAt: last?.startsAt ?? null };
      });

      appointmentsTotal += activity.count;
      const owner = ownerByTenant.get(t.id);
      establishments.push({
        id: t.id,
        name: t.name,
        slug: t.slug,
        establishmentType: t.establishmentType,
        status: t.status,
        plan: t.plan,
        trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        createdAt: t.createdAt.toISOString(),
        appointments: activity.count,
        lastActivityAt: activity.lastActivityAt
          ? activity.lastActivityAt.toISOString()
          : null,
      });
    }

    // Ordena por atividade (assinantes mais engajados primeiro).
    establishments.sort((a, b) => b.appointments - a.appointments);

    const byStatus = (s: string) => tenants.filter((t) => t.status === s).length;

    return {
      subscribers: {
        total: tenants.length,
        active: byStatus('ACTIVE'),
        trial: byStatus('TRIAL'),
        suspended: byStatus('SUSPENDED'),
        cancelled: byStatus('CANCELLED'),
        newThisMonth: tenants.filter((t) => t.createdAt >= startOfMonth).length,
      },
      appointmentsTotal,
      establishments,
    };
  }
}
