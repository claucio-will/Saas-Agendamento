import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  cancelAppointmentSchema,
  createManualAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  UserRole,
  type AppointmentResponseDto,
  type CancelAppointmentDto,
  type CreateManualAppointmentDto,
  type RescheduleAppointmentDto,
  type UpdateAppointmentStatusDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { TenantId } from '../../auth/interface/tenant-id.decorator';
import { AppointmentsService } from '../application/appointments.service';

/** Gestão da agenda pelo dono (TENANT_ADMIN). Ver PRD 2.5/2.9. */
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(
    @TenantId() tenantId: string,
    @Query('date') date: string,
    @Query('professionalId') professionalId?: string,
  ): Promise<AppointmentResponseDto[]> {
    const day = date ?? new Date().toISOString().slice(0, 10);
    return this.appointments.listByDay(tenantId, day, professionalId);
  }

  @Post()
  @HttpCode(201)
  create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createManualAppointmentSchema))
    dto: CreateManualAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointments.createManual(tenantId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateAppointmentStatusSchema))
    dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointments.updateStatus(tenantId, id, dto.status);
  }

  @Post(':id/cancel')
  cancel(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(cancelAppointmentSchema))
    dto: CancelAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointments.cancel(tenantId, id, dto.reason ?? null);
  }

  @Post(':id/reschedule')
  reschedule(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(rescheduleAppointmentSchema))
    dto: RescheduleAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointments.reschedule(tenantId, id, dto);
  }
}
