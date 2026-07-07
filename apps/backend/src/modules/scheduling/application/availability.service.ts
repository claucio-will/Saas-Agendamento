import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AvailabilityResponseDto } from '@repo/shared';
import { DateTime } from 'luxon';
import { computeAvailableSlots } from '../domain/slot-engine';
import {
  SchedulingRepository,
  type TenantSchedulingInfo,
} from '../infrastructure/scheduling.repository';

/** Calcula horários livres para um serviço numa data. Ver PRD 2.9. */
@Injectable()
export class AvailabilityService {
  constructor(private readonly repo: SchedulingRepository) {}

  async getBySlug(
    slug: string,
    serviceId: string,
    date: string,
    professionalId?: string,
  ): Promise<AvailabilityResponseDto> {
    const tenant = await this.repo.getTenantBySlug(slug);
    if (!tenant || tenant.status === 'CANCELLED') {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    return this.compute(tenant, serviceId, date, professionalId);
  }

  async compute(
    tenant: TenantSchedulingInfo,
    serviceId: string,
    date: string,
    professionalId?: string,
  ): Promise<AvailabilityResponseDto> {
    const service = await this.repo.getService(tenant.id, serviceId);
    if (!service) throw new NotFoundException('Serviço não encontrado.');

    const dayStart = DateTime.fromISO(date, { zone: tenant.timezone }).startOf(
      'day',
    );
    if (!dayStart.isValid) {
      throw new BadRequestException('Data inválida (use YYYY-MM-DD).');
    }
    const weekday = dayStart.weekday % 7; // luxon 1..7 (Seg..Dom) → 0..6 (Dom..Sáb)
    const dayStartUtc = dayStart.toUTC().toJSDate();
    const dayEndUtc = dayStart.endOf('day').toUTC().toJSDate();

    const now = Date.now();
    const earliest = new Date(
      Math.max(now + tenant.minAdvanceMinutes * 60_000, dayStartUtc.getTime()),
    );
    const latest = new Date(
      Math.min(
        now + tenant.maxAdvanceDays * 86_400_000,
        dayEndUtc.getTime(),
      ),
    );

    let professionals = await this.repo.getProfessionalsForService(
      tenant.id,
      serviceId,
    );
    if (professionalId) {
      professionals = professionals.filter((p) => p.id === professionalId);
    }

    const result = [];
    for (const pro of professionals) {
      const hours = (
        await this.repo.getWorkingHours(tenant.id, pro.id)
      ).filter((h) => h.weekday === weekday);
      const workingIntervals = hours.map((h) => ({
        start: dayStart.plus({ minutes: h.startMinute }).toUTC().toJSDate(),
        end: dayStart.plus({ minutes: h.endMinute }).toUTC().toJSDate(),
      }));
      const busy = await this.repo.getBusyIntervals(
        tenant.id,
        pro.id,
        dayStartUtc,
        dayEndUtc,
      );
      const slots = computeAvailableSlots({
        workingIntervals,
        busyIntervals: busy,
        serviceDurationMinutes: service.durationMinutes,
        slotIntervalMinutes: tenant.slotIntervalMinutes,
        earliest,
        latest,
      });
      result.push({
        professionalId: pro.id,
        professionalName: pro.name,
        slots: slots.map((s) => s.toISOString()),
      });
    }

    return { serviceId, date, professionals: result };
  }
}
