import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  createServiceSchema,
  updateServiceSchema,
  UserRole,
  type CreateServiceDto,
  type ServiceResponseDto,
  type UpdateServiceDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { TenantId } from '../../auth/interface/tenant-id.decorator';
import { CatalogService } from '../application/catalog.service';

/** CRUD de serviços do estabelecimento (dono). Ver PRD 2.5. */
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
export class ServiceController {
  constructor(private readonly catalog: CatalogService) {}

  @Post()
  @HttpCode(201)
  create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createServiceSchema)) dto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.catalog.createService(tenantId, dto);
  }

  @Get()
  list(@TenantId() tenantId: string): Promise<ServiceResponseDto[]> {
    return this.catalog.listServices(tenantId);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateServiceSchema)) dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.catalog.updateService(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.catalog.deleteService(tenantId, id);
  }
}
