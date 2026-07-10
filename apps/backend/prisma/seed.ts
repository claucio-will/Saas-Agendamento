import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';

/**
 * Seed de DEMONSTRAÇÃO. Recria a base do zero com dados realistas e coerentes
 * para navegar os 3 papéis (Admin · Dono · Cliente) com o sistema "vivo":
 * estabelecimentos montados, agenda cheia hoje, histórico do cliente e
 * avaliações. Rode com `npm run db:seed`.
 *
 * RLS: o Prisma roda como `app_user` (não-superusuário), então toda escrita em
 * tabela de negócio ocorre dentro de uma transação com `app.current_tenant`
 * definido (ver `runForTenant`). `Tenant`/`User` são tabelas de identidade
 * (não-RLS) — escrita direta.
 */
const prisma = new PrismaClient();
const ZONE = 'America/Sao_Paulo';

/** Executa `fn` no contexto RLS de um tenant (igual a PrismaService.runWithTenant). */
function runForTenant<T>(
  tenantId: string,
  fn: (tx: PrismaTx) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
    return fn(tx as unknown as PrismaTx);
  });
}
type PrismaTx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/** Data/hora no fuso de SP → Date (UTC). dayOffset relativo a hoje. */
function at(dayOffset: number, hour: number, minute = 0): Date {
  return DateTime.now()
    .setZone(ZONE)
    .startOf('day')
    .plus({ days: dayOffset, hours: hour, minutes: minute })
    .toUTC()
    .toJSDate();
}

const h = (hour: number, minute = 0) => hour * 60 + minute; // minutos desde 00:00

// ---------------------------------------------------------------------------
// Configuração declarativa dos estabelecimentos de demo
// ---------------------------------------------------------------------------
type Status = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface ProCfg {
  name: string;
  bio: string;
  /** Jornada: dias da semana (0=Dom..6=Sáb) com início/fim em minutos. */
  days: number[];
  start: number;
  end: number;
}
interface SvcCfg {
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  pricingType: 'FIXED' | 'STARTING_AT' | 'QUOTE';
  pros: number[]; // índices em ProCfg[]
}
interface ApptCfg {
  pro: number; // índice do profissional
  svc: number; // índice do serviço
  customer?: string; // key de CUSTOMERS (cliente logado)
  guestName?: string; // agendamento de balcão sem conta
  guestPhone?: string;
  dayOffset: number;
  hour: number;
  minute?: number;
  status: Status;
}
interface ReviewCfg {
  customer: string;
  rating: number;
  comment?: string;
}
interface TenantCfg {
  name: string;
  slug: string;
  establishmentType: 'BARBERSHOP' | 'HAIR_SALON' | 'TATTOO_STUDIO';
  status: 'TRIAL' | 'ACTIVE';
  plan: 'ESSENCIAL' | 'PROFISSIONAL' | 'STUDIO';
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  owner: { name: string; email: string };
  pros: ProCfg[];
  services: SvcCfg[];
  appointments: ApptCfg[];
  reviews: ReviewCfg[];
}

const CUSTOMERS = [
  { key: 'joao', name: 'João Cliente', email: 'joao@cliente.com', phone: '(11) 91111-1111' },
  { key: 'maria', name: 'Maria Souza', email: 'maria@cliente.com', phone: '(11) 92222-2222' },
  { key: 'pedro', name: 'Pedro Lima', email: 'pedro@cliente.com', phone: '(11) 93333-3333' },
  { key: 'ana', name: 'Ana Costa', email: 'ana@cliente.com', phone: '(11) 94444-4444' },
] as const;

const WEEK = [1, 2, 3, 4, 5, 6]; // Seg..Sáb

const TENANTS: TenantCfg[] = [
  {
    name: 'Barbearia do Zé',
    slug: 'barbearia-do-ze',
    establishmentType: 'BARBERSHOP',
    status: 'ACTIVE',
    plan: 'PROFISSIONAL',
    phone: '(11) 3333-1000',
    addressLine: 'Rua das Palmeiras, 120',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01000-000',
    owner: { name: 'José Ferreira', email: 'ze@barbearia.com' },
    pros: [
      { name: 'Zé Ferreira', bio: 'Barbeiro há 15 anos, especialista em navalha.', days: WEEK, start: h(9), end: h(19) },
      { name: 'Marcão', bio: 'Degradê e freestyle.', days: [2, 3, 4, 5, 6], start: h(10), end: h(19) },
    ],
    services: [
      { name: 'Corte masculino', description: 'Máquina e tesoura', durationMinutes: 30, priceCents: 4000, pricingType: 'FIXED', pros: [0, 1] },
      { name: 'Barba', description: 'Toalha quente + navalha', durationMinutes: 20, priceCents: 2500, pricingType: 'FIXED', pros: [0, 1] },
      { name: 'Corte + Barba', durationMinutes: 50, priceCents: 6000, pricingType: 'FIXED', pros: [0, 1] },
      { name: 'Pezinho', durationMinutes: 15, priceCents: 1500, pricingType: 'FIXED', pros: [1] },
    ],
    appointments: [
      // Hoje — agenda cheia
      { pro: 0, svc: 0, customer: 'maria', dayOffset: 0, hour: 9, status: 'CONFIRMED' },
      { pro: 0, svc: 2, customer: 'pedro', dayOffset: 0, hour: 10, status: 'CONFIRMED' },
      { pro: 0, svc: 1, guestName: 'Cliente Balcão', guestPhone: '(11) 90000-0001', dayOffset: 0, hour: 11, status: 'PENDING' },
      { pro: 1, svc: 0, customer: 'ana', dayOffset: 0, hour: 10, minute: 30, status: 'CONFIRMED' },
      { pro: 1, svc: 3, guestName: 'Lucas M.', dayOffset: 0, hour: 11, minute: 30, status: 'PENDING' },
      { pro: 0, svc: 0, customer: 'joao', dayOffset: 0, hour: 16, status: 'CONFIRMED' },
      { pro: 1, svc: 2, customer: 'maria', dayOffset: 0, hour: 17, status: 'PENDING' },
      // Passado — histórico/atendimentos concluídos
      { pro: 0, svc: 2, customer: 'joao', dayOffset: -7, hour: 15, status: 'COMPLETED' },
      { pro: 0, svc: 0, customer: 'joao', dayOffset: -21, hour: 10, status: 'COMPLETED' },
      { pro: 1, svc: 0, customer: 'pedro', dayOffset: -3, hour: 14, status: 'COMPLETED' },
      { pro: 0, svc: 1, customer: 'ana', dayOffset: -5, hour: 16, status: 'NO_SHOW' },
      { pro: 1, svc: 0, customer: 'maria', dayOffset: -10, hour: 11, status: 'CANCELLED' },
      // Futuro — cliente pode cancelar/remarcar
      { pro: 0, svc: 2, customer: 'joao', dayOffset: 4, hour: 15, status: 'CONFIRMED' },
      { pro: 1, svc: 0, customer: 'pedro', dayOffset: 6, hour: 10, status: 'PENDING' },
    ],
    reviews: [
      { customer: 'joao', rating: 5, comment: 'Melhor corte da região, atendimento nota 10!' },
      { customer: 'pedro', rating: 4, comment: 'Bom serviço, só demorou um pouco.' },
    ],
  },
  {
    name: 'Salão Bela Hair',
    slug: 'salao-bela-hair',
    establishmentType: 'HAIR_SALON',
    status: 'ACTIVE',
    plan: 'STUDIO',
    phone: '(11) 3333-2000',
    addressLine: 'Av. Central, 900',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '02000-000',
    owner: { name: 'Isabela Ramos', email: 'bela@salao.com' },
    pros: [
      { name: 'Isabela Ramos', bio: 'Colorista e visagista.', days: WEEK, start: h(9), end: h(19) },
      { name: 'Carla Dias', bio: 'Cortes e escova.', days: [1, 2, 3, 4, 5], start: h(9), end: h(18) },
    ],
    services: [
      { name: 'Corte feminino', durationMinutes: 45, priceCents: 7000, pricingType: 'FIXED', pros: [0, 1] },
      { name: 'Escova', durationMinutes: 40, priceCents: 5000, pricingType: 'FIXED', pros: [0, 1] },
      { name: 'Coloração', description: 'Valor varia com o comprimento', durationMinutes: 120, priceCents: 15000, pricingType: 'STARTING_AT', pros: [0] },
      { name: 'Manicure', durationMinutes: 40, priceCents: 4000, pricingType: 'FIXED', pros: [1] },
    ],
    appointments: [
      { pro: 0, svc: 0, customer: 'ana', dayOffset: 0, hour: 9, status: 'CONFIRMED' },
      { pro: 0, svc: 2, customer: 'maria', dayOffset: 0, hour: 10, minute: 30, status: 'CONFIRMED' },
      { pro: 1, svc: 1, customer: 'joao', dayOffset: 0, hour: 11, status: 'PENDING' },
      { pro: 1, svc: 3, guestName: 'Fernanda', guestPhone: '(11) 90000-0002', dayOffset: 0, hour: 14, status: 'CONFIRMED' },
      { pro: 0, svc: 0, customer: 'ana', dayOffset: -14, hour: 15, status: 'COMPLETED' },
      { pro: 1, svc: 1, customer: 'joao', dayOffset: -9, hour: 10, status: 'COMPLETED' },
      { pro: 0, svc: 2, customer: 'maria', dayOffset: 5, hour: 9, status: 'CONFIRMED' },
    ],
    reviews: [
      { customer: 'ana', rating: 5, comment: 'Amei a coloração, super recomendo!' },
      { customer: 'joao', rating: 5, comment: 'Escova impecável e no horário.' },
    ],
  },
  {
    name: 'Estúdio Tinta Preta',
    slug: 'estudio-tinta-preta',
    establishmentType: 'TATTOO_STUDIO',
    status: 'TRIAL',
    plan: 'ESSENCIAL',
    phone: '(11) 3333-3000',
    addressLine: 'Rua Augusta, 500',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01310-000',
    owner: { name: 'Rafael Nunes', email: 'tinta@estudio.com' },
    pros: [
      { name: 'Rafa Nunes', bio: 'Blackwork e fineline.', days: [2, 3, 4, 5, 6], start: h(11), end: h(20) },
      { name: 'Bruno Alves', bio: 'Realismo e sombreado.', days: [3, 4, 5, 6], start: h(12), end: h(20) },
    ],
    services: [
      { name: 'Tatuagem pequena', description: 'Até 10cm', durationMinutes: 60, priceCents: 30000, pricingType: 'STARTING_AT', pros: [0, 1] },
      { name: 'Sessão (fechamento)', description: 'Orçamento sob consulta', durationMinutes: 240, priceCents: 0, pricingType: 'QUOTE', pros: [0, 1] },
      { name: 'Retoque', durationMinutes: 45, priceCents: 0, pricingType: 'QUOTE', pros: [0] },
      { name: 'Piercing', durationMinutes: 20, priceCents: 8000, pricingType: 'FIXED', pros: [1] },
    ],
    appointments: [
      { pro: 0, svc: 0, customer: 'pedro', dayOffset: 0, hour: 14, status: 'CONFIRMED' },
      { pro: 1, svc: 3, guestName: 'Tati', guestPhone: '(11) 90000-0003', dayOffset: 0, hour: 15, status: 'PENDING' },
      { pro: 0, svc: 0, customer: 'maria', dayOffset: -12, hour: 16, status: 'COMPLETED' },
      { pro: 0, svc: 1, customer: 'pedro', dayOffset: 8, hour: 13, status: 'CONFIRMED' },
    ],
    reviews: [
      { customer: 'maria', rating: 5, comment: 'Traço perfeito, ambiente impecável.' },
    ],
  },
];

async function main(): Promise<void> {
  // ---- Wipe: apaga tudo (cascata via FK). Idempotente. --------------------
  await prisma.tenant.deleteMany({}); // cascateia staff, serviços, agenda, reviews
  await prisma.user.deleteMany({}); // remove clientes e super admin (tenantId nulo)

  // ---- Super Admin --------------------------------------------------------
  await prisma.user.create({
    data: {
      email: 'admin@plataforma.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      emailVerified: true,
      passwordHash: await hash('admin12345'),
    },
  });

  // ---- Clientes finais ----------------------------------------------------
  const customerPass = await hash('cliente12345');
  const customerId = new Map<string, string>();
  for (const c of CUSTOMERS) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        name: c.name,
        phone: c.phone,
        role: 'CUSTOMER',
        emailVerified: true,
        passwordHash: customerPass,
      },
    });
    customerId.set(c.key, u.id);
  }
  const customerByKey = new Map<string, (typeof CUSTOMERS)[number]>(
    CUSTOMERS.map((c) => [c.key, c]),
  );

  // ---- Estabelecimentos ---------------------------------------------------
  const ownerPass = await hash('dono12345');

  for (const cfg of TENANTS) {
    const tenant = await prisma.tenant.create({
      data: {
        name: cfg.name,
        slug: cfg.slug,
        establishmentType: cfg.establishmentType,
        status: cfg.status,
        plan: cfg.plan,
        // ACTIVE = já pagou (assinou no passado); TRIAL = em teste (expira em breve).
        subscribedAt: cfg.status === 'ACTIVE' ? at(-30, 10) : null,
        trialEndsAt: cfg.status === 'TRIAL' ? at(7, 23, 59) : null,
        phone: cfg.phone,
        addressLine: cfg.addressLine,
        city: cfg.city,
        state: cfg.state,
        postalCode: cfg.postalCode,
      },
    });

    // Dono (TENANT_ADMIN) — identidade, fora do contexto RLS.
    await prisma.user.create({
      data: {
        email: cfg.owner.email,
        name: cfg.owner.name,
        role: 'TENANT_ADMIN',
        tenantId: tenant.id,
        emailVerified: true,
        passwordHash: ownerPass,
      },
    });

    // Catálogo + agenda dentro do contexto do tenant (RLS).
    await runForTenant(tenant.id, async (tx) => {
      // Profissionais + jornadas
      const proIds: string[] = [];
      for (const p of cfg.pros) {
        const pro = await tx.professional.create({
          data: { tenantId: tenant.id, name: p.name, bio: p.bio },
        });
        proIds.push(pro.id);
        await tx.workingHours.createMany({
          data: p.days.map((weekday) => ({
            tenantId: tenant.id,
            professionalId: pro.id,
            weekday,
            startMinute: p.start,
            endMinute: p.end,
          })),
        });
      }

      // Serviços + vínculos profissional↔serviço
      const svc: { id: string; durationMinutes: number; priceCents: number }[] = [];
      for (const s of cfg.services) {
        const service = await tx.service.create({
          data: {
            tenantId: tenant.id,
            name: s.name,
            description: s.description ?? null,
            durationMinutes: s.durationMinutes,
            priceCents: s.priceCents,
            pricingType: s.pricingType,
          },
        });
        svc.push({
          id: service.id,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
        });
        await tx.serviceProfessional.createMany({
          data: s.pros.map((idx) => ({
            tenantId: tenant.id,
            serviceId: service.id,
            professionalId: proIds[idx]!,
          })),
        });
      }

      // Agendamentos
      for (const a of cfg.appointments) {
        const service = svc[a.svc]!;
        const startsAt = at(a.dayOffset, a.hour, a.minute ?? 0);
        const endsAt = new Date(
          startsAt.getTime() + service.durationMinutes * 60_000,
        );
        const cust = a.customer ? customerByKey.get(a.customer) : undefined;
        await tx.appointment.create({
          data: {
            tenantId: tenant.id,
            serviceId: service.id,
            professionalId: proIds[a.pro]!,
            customerId: a.customer ? customerId.get(a.customer)! : null,
            customerName: cust?.name ?? a.guestName ?? 'Cliente',
            customerEmail: cust?.email ?? 'balcao@local',
            customerPhone: cust?.phone ?? a.guestPhone ?? null,
            startsAt,
            endsAt,
            status: a.status,
            priceCents: service.priceCents,
          },
        });
      }

      // Avaliações
      for (const r of cfg.reviews) {
        const cust = customerByKey.get(r.customer)!;
        await tx.review.create({
          data: {
            tenantId: tenant.id,
            customerId: customerId.get(r.customer)!,
            customerName: cust.name,
            rating: r.rating,
            comment: r.comment ?? null,
          },
        });
      }
    });
  }

  // Tabelas de negócio são RLS: contar via count() aqui (sem tenant no contexto)
  // retornaria 0. Somamos pela própria configuração de demo.
  const totals = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    appointments: TENANTS.reduce((n, t) => n + t.appointments.length, 0),
    reviews: TENANTS.reduce((n, t) => n + t.reviews.length, 0),
  };

  console.log('\n✅ Seed de demonstração concluído.', totals);
  console.log('\n── Credenciais de acesso ───────────────────────────────');
  console.log('Admin    : admin@plataforma.com / admin12345');
  console.log('Dono     : ze@barbearia.com     / dono12345  (Barbearia do Zé)');
  console.log('           bela@salao.com        / dono12345  (Salão Bela Hair)');
  console.log('           tinta@estudio.com     / dono12345  (Estúdio Tinta Preta)');
  console.log('Cliente  : joao@cliente.com      / cliente12345  (com histórico)');
  console.log('           maria|pedro|ana@cliente.com / cliente12345');
  console.log('────────────────────────────────────────────────────────\n');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
