import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole, type CustomerSummaryDto } from '@repo/shared';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { TenantId } from '../../auth/interface/tenant-id.decorator';
import { AppointmentsService } from '../application/appointments.service';

/** Clientes do estabelecimento (agregados dos agendamentos). Ver PRD 2.5. */
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
export class CustomersController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(@TenantId() tenantId: string): Promise<CustomerSummaryDto[]> {
    return this.appointments.listCustomers(tenantId);
  }
}
