import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant/tenant-context.service';

/** Serviços transversais (contexto de tenant, etc.). */
@Global()
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class CommonModule {}
