import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  createTimeBlockSchema,
  UserRole,
  type CreateTimeBlockDto,
  type TimeBlockResponseDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { TenantId } from '../../auth/interface/tenant-id.decorator';
import { CatalogService } from '../application/catalog.service';

/** Folgas/bloqueios de agenda do profissional (dono). Ver PRD 2.5/2.6. */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
export class TimeBlockController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('professionals/:id/time-blocks')
  list(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) professionalId: string,
  ): Promise<TimeBlockResponseDto[]> {
    return this.catalog.listTimeBlocks(tenantId, professionalId);
  }

  @Post('professionals/:id/time-blocks')
  @HttpCode(201)
  create(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) professionalId: string,
    @Body(new ZodValidationPipe(createTimeBlockSchema))
    dto: CreateTimeBlockDto,
  ): Promise<TimeBlockResponseDto> {
    return this.catalog.createTimeBlock(tenantId, professionalId, dto);
  }

  @Delete('time-blocks/:id')
  @HttpCode(204)
  async remove(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.catalog.deleteTimeBlock(tenantId, id);
  }
}
