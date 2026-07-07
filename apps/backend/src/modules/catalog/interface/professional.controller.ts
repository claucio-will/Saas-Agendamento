import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  createProfessionalSchema,
  setWorkingHoursSchema,
  updateProfessionalSchema,
  UserRole,
  type CreateProfessionalDto,
  type ProfessionalResponseDto,
  type SetWorkingHoursDto,
  type UpdateProfessionalDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { TenantId } from '../../auth/interface/tenant-id.decorator';
import { CatalogService } from '../application/catalog.service';

/** CRUD de profissionais + jornadas (dono). Ver PRD 2.5/2.6. */
@Controller('professionals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
export class ProfessionalController {
  constructor(private readonly catalog: CatalogService) {}

  @Post()
  @HttpCode(201)
  create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createProfessionalSchema))
    dto: CreateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.catalog.createProfessional(tenantId, dto);
  }

  @Get()
  list(@TenantId() tenantId: string): Promise<ProfessionalResponseDto[]> {
    return this.catalog.listProfessionals(tenantId);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateProfessionalSchema))
    dto: UpdateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.catalog.updateProfessional(tenantId, id, dto);
  }

  @Put(':id/working-hours')
  setWorkingHours(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(setWorkingHoursSchema)) dto: SetWorkingHoursDto,
  ): Promise<ProfessionalResponseDto> {
    return this.catalog.setWorkingHours(tenantId, id, dto);
  }
}
