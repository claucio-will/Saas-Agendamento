import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogService } from './application/catalog.service';
import { CatalogRepository } from './infrastructure/catalog.repository';
import { ProfessionalController } from './interface/professional.controller';
import { ServiceController } from './interface/service.controller';
import { TimeBlockController } from './interface/time-block.controller';

/** Bounded context Catalog (serviços, profissionais, jornadas). */
@Module({
  imports: [AuthModule],
  controllers: [ServiceController, ProfessionalController, TimeBlockController],
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogRepository],
})
export class CatalogModule {}
