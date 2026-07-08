import { ConflictException, Injectable } from '@nestjs/common';
import type { AppointmentStatus } from '@repo/shared';
import { PrismaService } from '../../../infra/prisma/prisma.service';

export interface TenantSchedulingInfo {
  id: string;
  slug: string;
  name: string;
  status: string;
  establishmentType: string;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  timezone: string;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
}

/** Serviço com seus profissionais, para o catálogo público (por slug). */
export interface PublicServiceRow {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  pricingType: string;
  professionals: { id: string; name: string }[];
}

export interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

export interface ProfessionalInfo {
  id: string;
  name: string;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

/** Cliente agregado do estabelecimento (a partir dos agendamentos). */
export interface CustomerRow {
  name: string;
  email: string;
  phone: string | null;
  totalAppointments: number;
  completedAppointments: number;
  totalSpentCents: number;
  lastVisit: Date;
}

export interface CreateAppointmentRow {
  serviceId: string;
  professionalId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  notes: string | null;
}

/** Acesso a dados do Scheduling. Tabelas de negócio via runWithTenant (RLS). */
@Injectable()
export class SchedulingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Tenant é tabela não-RLS: consulta direta por slug (rota pública). */
  async getTenantBySlug(slug: string): Promise<TenantSchedulingInfo | null> {
    const t = await this.prisma.tenant.findUnique({ where: { slug } });
    return t ? this.toTenantInfo(t) : null;
  }

  async getTenantById(id: string): Promise<TenantSchedulingInfo | null> {
    const t = await this.prisma.tenant.findUnique({ where: { id } });
    return t ? this.toTenantInfo(t) : null;
  }

  /** Serviços ativos + profissionais ativos, para a página pública. */
  listPublicServices(tenantId: string): Promise<PublicServiceRow[]> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const rows = await tx.service.findMany({
        where: { active: true },
        orderBy: { createdAt: 'asc' },
        include: {
          professionals: {
            include: {
              professional: { select: { id: true, name: true, active: true } },
            },
          },
        },
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        durationMinutes: r.durationMinutes,
        priceCents: r.priceCents,
        pricingType: r.pricingType,
        professionals: r.professionals
          .filter((l) => l.professional.active)
          .map((l) => ({ id: l.professional.id, name: l.professional.name })),
      }));
    });
  }

  getService(tenantId: string, serviceId: string): Promise<ServiceInfo | null> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const s = await tx.service.findFirst({
        where: { id: serviceId, active: true },
      });
      return s
        ? {
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            priceCents: s.priceCents,
          }
        : null;
    });
  }

  getProfessionalsForService(
    tenantId: string,
    serviceId: string,
  ): Promise<ProfessionalInfo[]> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const links = await tx.serviceProfessional.findMany({
        where: { serviceId },
        include: { professional: true },
      });
      return links
        .filter((l) => l.professional.active)
        .map((l) => ({ id: l.professional.id, name: l.professional.name }));
    });
  }

  getWorkingHours(
    tenantId: string,
    professionalId: string,
  ): Promise<{ weekday: number; startMinute: number; endMinute: number }[]> {
    return this.prisma.runWithTenant(tenantId, (tx) =>
      tx.workingHours.findMany({
        where: { professionalId },
        select: { weekday: true, startMinute: true, endMinute: true },
      }),
    );
  }

  getBusyIntervals(
    tenantId: string,
    professionalId: string,
    from: Date,
    to: Date,
  ): Promise<BusyInterval[]> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const [appts, blocks] = await Promise.all([
        tx.appointment.findMany({
          where: {
            professionalId,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            startsAt: { lt: to },
            endsAt: { gt: from },
          },
          select: { startsAt: true, endsAt: true },
        }),
        tx.timeBlock.findMany({
          where: {
            professionalId,
            startsAt: { lt: to },
            endsAt: { gt: from },
          },
          select: { startsAt: true, endsAt: true },
        }),
      ]);
      return [...appts, ...blocks].map((x) => ({
        start: x.startsAt,
        end: x.endsAt,
      }));
    });
  }

  async createAppointment(
    tenantId: string,
    data: CreateAppointmentRow,
  ): Promise<{ id: string }> {
    try {
      return await this.prisma.runWithTenant(tenantId, (tx) =>
        tx.appointment.create({
          data: { tenantId, status: 'PENDING', ...data },
          select: { id: true },
        }),
      );
    } catch (err) {
      if (this.isOverlapError(err)) {
        throw new ConflictException('Este horário acabou de ser reservado.');
      }
      throw err;
    }
  }

  /** Clientes do estabelecimento, agregados a partir dos agendamentos. */
  listCustomers(tenantId: string): Promise<CustomerRow[]> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      // Ordena do mais recente ao mais antigo: a 1ª ocorrência de cada e-mail
      // carrega o nome/telefone mais atuais e a última visita.
      const appts = await tx.appointment.findMany({
        orderBy: { startsAt: 'desc' },
        select: {
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          startsAt: true,
          priceCents: true,
          status: true,
        },
      });

      const byEmail = new Map<string, CustomerRow>();
      for (const a of appts) {
        const key = a.customerEmail.toLowerCase();
        let c = byEmail.get(key);
        if (!c) {
          c = {
            name: a.customerName,
            email: a.customerEmail,
            phone: a.customerPhone,
            totalAppointments: 0,
            completedAppointments: 0,
            totalSpentCents: 0,
            lastVisit: a.startsAt,
          };
          byEmail.set(key, c);
        }
        c.totalAppointments += 1;
        if (a.status === 'COMPLETED') {
          c.completedAppointments += 1;
          c.totalSpentCents += a.priceCents;
        }
        if (!c.phone && a.customerPhone) c.phone = a.customerPhone;
      }
      return [...byEmail.values()];
    });
  }

  listAppointments(
    tenantId: string,
    from: Date,
    to: Date,
    professionalId?: string,
  ) {
    return this.prisma.runWithTenant(tenantId, (tx) =>
      tx.appointment.findMany({
        where: {
          startsAt: { gte: from, lt: to },
          ...(professionalId ? { professionalId } : {}),
        },
        include: {
          service: { select: { name: true } },
          professional: { select: { name: true } },
        },
        orderBy: { startsAt: 'asc' },
      }),
    );
  }

  getAppointment(tenantId: string, id: string) {
    return this.prisma.runWithTenant(tenantId, (tx) =>
      tx.appointment.findUnique({
        where: { id },
        include: {
          service: { select: { name: true, durationMinutes: true } },
          professional: { select: { name: true } },
        },
      }),
    );
  }

  updateStatus(tenantId: string, id: string, status: AppointmentStatus) {
    return this.prisma.runWithTenant(tenantId, (tx) =>
      tx.appointment
        .update({ where: { id }, data: { status } })
        .catch(() => null),
    );
  }

  cancel(tenantId: string, id: string, reason: string | null) {
    return this.prisma.runWithTenant(tenantId, (tx) =>
      tx.appointment
        .update({
          where: { id },
          data: { status: 'CANCELLED', cancelReason: reason },
        })
        .catch(() => null),
    );
  }

  async reschedule(
    tenantId: string,
    id: string,
    startsAt: Date,
    endsAt: Date,
    professionalId: string | undefined,
  ): Promise<{ id: string } | null> {
    try {
      return await this.prisma.runWithTenant(tenantId, (tx) =>
        tx.appointment
          .update({
            where: { id },
            data: {
              startsAt,
              endsAt,
              ...(professionalId ? { professionalId } : {}),
            },
            select: { id: true },
          })
          .catch(() => null),
      );
    } catch (err) {
      if (this.isOverlapError(err)) {
        throw new ConflictException('O novo horário conflita com outro.');
      }
      throw err;
    }
  }

  private isOverlapError(err: unknown): boolean {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : '';
    return msg.includes('appointments_no_overlap') || msg.includes('23P01');
  }

  private toTenantInfo(t: {
    id: string;
    slug: string;
    name: string;
    status: string;
    establishmentType: string;
    phone: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    timezone: string;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
    slotIntervalMinutes: number;
  }): TenantSchedulingInfo {
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      status: t.status,
      establishmentType: t.establishmentType,
      phone: t.phone,
      addressLine: t.addressLine,
      city: t.city,
      state: t.state,
      timezone: t.timezone,
      minAdvanceMinutes: t.minAdvanceMinutes,
      maxAdvanceDays: t.maxAdvanceDays,
      slotIntervalMinutes: t.slotIntervalMinutes,
    };
  }
}
