import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  rescheduleAppointmentSchema,
  UserRole,
  type CustomerAppointmentDto,
  type RescheduleAppointmentDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CurrentUser,
  type AuthUserPrincipal,
} from '../../auth/interface/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { AppointmentsService } from '../application/appointments.service';
import { CustomerAppointmentsService } from '../application/customer-appointments.service';

/** Área do cliente logado: histórico e ações sobre os próprios agendamentos. */
@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class MyAppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly customerAppointments: CustomerAppointmentsService,
  ) {}

  @Get('appointments')
  list(
    @CurrentUser() principal: AuthUserPrincipal,
  ): Promise<CustomerAppointmentDto[]> {
    return this.appointments.listForCustomer(principal.userId);
  }

  @Post('appointments/:id/cancel')
  @HttpCode(204)
  async cancel(
    @CurrentUser() principal: AuthUserPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.customerAppointments.cancel(principal.userId, id);
  }

  @Post('appointments/:id/reschedule')
  @HttpCode(204)
  async reschedule(
    @CurrentUser() principal: AuthUserPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(rescheduleAppointmentSchema))
    dto: RescheduleAppointmentDto,
  ): Promise<void> {
    await this.customerAppointments.reschedule(
      principal.userId,
      id,
      dto.startsAt,
    );
  }
}
