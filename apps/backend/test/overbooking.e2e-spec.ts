import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/infra/prisma/prisma.service';

/**
 * Prova a prevenção de overbooking (PRD 2.9 / 8.2 §5): a constraint de exclusão
 * do Postgres impede dois agendamentos ATIVOS sobrepostos para o mesmo
 * profissional, mesmo sob concorrência real (inserts em paralelo). Requer DB.
 */
describe('Prevenção de overbooking (constraint de exclusão)', () => {
  const prisma = new PrismaService();
  const tenantId = randomUUID();
  let serviceId: string;
  let professionalId: string;

  const start = new Date('2026-08-01T13:00:00.000Z');
  const end = new Date('2026-08-01T13:30:00.000Z');

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Barbearia Concorrência',
        slug: `conc-${tenantId}`,
        establishmentType: 'BARBERSHOP',
      },
    });

    await prisma.runWithTenant(tenantId, async (tx) => {
      const service = await tx.service.create({
        data: {
          tenantId,
          name: 'Corte',
          durationMinutes: 30,
          priceCents: 5000,
        },
      });
      const professional = await tx.professional.create({
        data: { tenantId, name: 'Barbeiro X' },
      });
      serviceId = service.id;
      professionalId = professional.id;
    });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  const book = () =>
    prisma.runWithTenant(tenantId, (tx) =>
      tx.appointment.create({
        data: {
          tenantId,
          serviceId,
          professionalId,
          customerName: 'Cliente',
          customerEmail: 'c@e.com',
          startsAt: start,
          endsAt: end,
          priceCents: 5000,
        },
      }),
    );

  it('duas reservas simultâneas no mesmo slot → apenas uma vence', async () => {
    const results = await Promise.allSettled([book(), book()]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
  });

  it('slot sobreposto (parcial) também é bloqueado', async () => {
    await expect(
      prisma.runWithTenant(tenantId, (tx) =>
        tx.appointment.create({
          data: {
            tenantId,
            serviceId,
            professionalId,
            customerName: 'Outro',
            customerEmail: 'o@e.com',
            startsAt: new Date('2026-08-01T13:15:00.000Z'),
            endsAt: new Date('2026-08-01T13:45:00.000Z'),
            priceCents: 5000,
          },
        }),
      ),
    ).rejects.toThrow();
  });

  it('agendamento CANCELADO não bloqueia o mesmo horário', async () => {
    // Cancela o agendamento vencedor...
    await prisma.runWithTenant(tenantId, (tx) =>
      tx.appointment.updateMany({
        where: { professionalId, startsAt: start, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      }),
    );
    // ...agora o mesmo slot pode ser reservado de novo.
    const created = await book();
    expect(created.id).toBeDefined();
  });
});
