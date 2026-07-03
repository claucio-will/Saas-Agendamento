import { PrismaClient } from '@prisma/client';

/**
 * Seed de desenvolvimento. Cria dois tenants de exemplo e alguns itens de
 * negócio — inseridos DENTRO do contexto de cada tenant (RLS exige
 * `app.current_tenant` definido). Rode com `npm run db:seed`.
 */
const prisma = new PrismaClient();

async function insertItemForTenant(tenantId: string, name: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
    await tx.exampleItem.create({ data: { tenantId, name } });
  });
}

async function main(): Promise<void> {
  const barbearia = await prisma.tenant.upsert({
    where: { slug: 'barbearia-do-ze' },
    update: {},
    create: {
      name: 'Barbearia do Zé',
      slug: 'barbearia-do-ze',
      establishmentType: 'BARBERSHOP',
      status: 'ACTIVE',
    },
  });

  const estudio = await prisma.tenant.upsert({
    where: { slug: 'estudio-tinta-preta' },
    update: {},
    create: {
      name: 'Estúdio Tinta Preta',
      slug: 'estudio-tinta-preta',
      establishmentType: 'TATTOO_STUDIO',
      status: 'TRIAL',
    },
  });

  await insertItemForTenant(barbearia.id, 'Item exemplo — Barbearia');
  await insertItemForTenant(estudio.id, 'Item exemplo — Estúdio');

  console.log('Seed concluído:', {
    barbearia: barbearia.slug,
    estudio: estudio.slug,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
