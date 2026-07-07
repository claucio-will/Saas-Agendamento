import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateTenantUseCase } from './application/create-tenant.usecase';
import { GetMyTenantUseCase } from './application/get-my-tenant.usecase';
import { ListTenantsUseCase } from './application/list-tenants.usecase';
import { OnboardTenantUseCase } from './application/onboard-tenant.usecase';
import { UpdateTenantStatusUseCase } from './application/update-tenant-status.usecase';
import { TENANT_REPOSITORY } from './domain/tenant.repository';
import { TENANT_PROVISIONER } from './domain/tenant-provisioning';
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository';
import { PrismaTenantProvisioningService } from './infrastructure/prisma-tenant-provisioning.service';
import { OnboardingController } from './interface/onboarding.controller';
import { TenantController } from './interface/tenant.controller';

/** Bounded context Tenant Management (módulo NestJS com camadas DDD). */
@Module({
  imports: [AuthModule],
  controllers: [TenantController, OnboardingController],
  providers: [
    CreateTenantUseCase,
    GetMyTenantUseCase,
    ListTenantsUseCase,
    OnboardTenantUseCase,
    UpdateTenantStatusUseCase,
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    { provide: TENANT_PROVISIONER, useClass: PrismaTenantProvisioningService },
  ],
})
export class TenantModule {}
