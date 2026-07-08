import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole, type CustomerAppointmentDto } from '@repo/shared';
import {
  CurrentUser,
  type AuthUserPrincipal,
} from '../../auth/interface/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { AppointmentsService } from '../application/appointments.service';

/** Histórico do cliente logado: seus agendamentos. Ver PRD 2.8. */
@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class MyAppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get('appointments')
  list(
    @CurrentUser() principal: AuthUserPrincipal,
  ): Promise<CustomerAppointmentDto[]> {
    return this.appointments.listForCustomer(principal.userId);
  }
}
