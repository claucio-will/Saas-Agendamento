import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/infra/prisma/prisma.service';

/**
 * Teste de isolamento cross-tenant — requisito CRÍTICO e inegociável.
 * Prova que o Row-Level Security do Postgres impede que um tenant leia ou
 * escreva dados de outro, mesmo com o ORM conectando como dono da tabela
 * (graças ao FORCE ROW LEVEL SECURITY). Ver PRD 2.3 / 8.2 §2.
 *
 * Requer Postgres com as migrações aplicadas (DATABASE_URL definido).
 */
describe('Isolamento multi-tenant via RLS', () => {
  const prisma = new PrismaService();
  const tenantA = randomUUID();
  const tenantB = randomUUID();

  beforeAll(async () => {
    await prisma.$connect();

    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
    await prisma.tenant.create({
      data: {
        id: tenantA,
        name: 'Tenant A',
        slug: `tenant-a-${tenantA}`,
        establishmentType: 'BARBERSHOP',
      },
    });
    await prisma.tenant.create({
      data: {
        id: tenantB,
        name: 'Tenant B',
        slug: `tenant-b-${tenantB}`,
        establishmentType: 'HAIR_SALON',
      },
    });

    await prisma.runWithTenant(tenantA, (tx) =>
      tx.exampleItem.create({ data: { tenantId: tenantA, name: 'item-A' } }),
    );
    await prisma.runWithTenant(tenantB, (tx) =>
      tx.exampleItem.create({ data: { tenantId: tenantB, name: 'item-B' } }),
    );
  });

  afterAll(async () => {
    for (const t of [tenantA, tenantB]) {
      await prisma.runWithTenant(t, (tx) => tx.exampleItem.deleteMany());
    }
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
    await prisma.$disconnect();
  });

  it('um tenant só enxerga os próprios itens', async () => {
    const items = await prisma.runWithTenant(tenantA, (tx) =>
      tx.exampleItem.findMany(),
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.tenantId).toBe(tenantA);
    expect(items[0]?.name).toBe('item-A');
  });

  it('não consegue ler o item de outro tenant nem por id direto', async () => {
    const itemB = await prisma.runWithTenant(tenantB, (tx) =>
      tx.exampleItem.findFirst(),
    );
    expect(itemB).not.toBeNull();

    const leak = await prisma.runWithTenant(tenantA, (tx) =>
      tx.exampleItem.findUnique({ where: { id: itemB!.id } }),
    );
    expect(leak).toBeNull();
  });

  it('sem contexto de tenant, nenhuma linha de negócio é visível (default nega tudo)', async () => {
    const rows = await prisma.exampleItem.findMany();
    expect(rows).toHaveLength(0);
  });

  it('WITH CHECK impede inserir linha marcada com outro tenant_id', async () => {
    await expect(
      prisma.runWithTenant(tenantA, (tx) =>
        tx.exampleItem.create({ data: { tenantId: tenantB, name: 'intruso' } }),
      ),
    ).rejects.toThrow();
  });
});
