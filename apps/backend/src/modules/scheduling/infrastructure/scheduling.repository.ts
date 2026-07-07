import { ConflictException, Injectable } from '@nestjs/common';
import type { AppointmentStatus } from '@repo/shared';
import { PrismaService } from '../../../infra/prisma/prisma.service';

export interface TenantSchedulingInfo {
  id: string;
  slug: string;
  name: string;
  status: string;
  timezone: string;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
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
      timezone: t.timezone,
      minAdvanceMinutes: t.minAdvanceMinutes,
      maxAdvanceDays: t.maxAdvanceDays,
      slotIntervalMinutes: t.slotIntervalMinutes,
    };
  }
}
