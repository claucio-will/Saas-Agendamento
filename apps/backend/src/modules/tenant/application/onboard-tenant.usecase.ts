import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  CURRENT_TERMS_VERSION,
  EstablishmentType,
  type OnboardingDto,
} from '@repo/shared';
import { Prisma } from '@prisma/client';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../auth/domain/password-hasher';
import { User } from '../../auth/domain/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../auth/domain/user.repository';
import { TokenIssuer } from '../../auth/application/token-issuer';
import type { Tenant } from '../domain/tenant.entity';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../domain/tenant.repository';
import {
  TENANT_PROVISIONER,
  type TenantProvisioner,
} from '../domain/tenant-provisioning';

export interface OnboardResult {
  tenant: Tenant;
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Onboarding self-service: cria o estabelecimento + o dono (TENANT_ADMIN),
 * registra o aceite de termos e já autentica o dono. Ver PRD 2.1.
 */
@Injectable()
export class OnboardTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TENANT_PROVISIONER)
    private readonly provisioner: TenantProvisioner,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(
    input: OnboardingDto,
    ipAddress: string | null,
  ): Promise<OnboardResult> {
    const email = input.owner.email.toLowerCase();

    if (await this.tenants.findBySlug(input.slug)) {
      throw new ConflictException(`O endereço "${input.slug}" já está em uso.`);
    }
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('E-mail do dono já cadastrado.');
    }

    const passwordHash = await this.hasher.hash(input.owner.password);

    let result;
    try {
      result = await this.provisioner.provision({
        tenant: {
          name: input.tenantName,
          slug: input.slug,
          establishmentType: input.establishmentType,
          documentId: input.documentId,
          phone: input.phone,
          addressLine: input.address.addressLine,
          city: input.address.city,
          state: input.address.state,
          postalCode: input.address.postalCode,
          settings: buildSettings(input),
        },
        owner: { name: input.owner.name, email, passwordHash },
        termsVersion: CURRENT_TERMS_VERSION,
        ipAddress,
      });
    } catch (err) {
      // Corrida com constraint única (slug/email) entre a checagem e o insert.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Estabelecimento ou e-mail já cadastrado.');
      }
      throw err;
    }

    const owner = new User(
      result.user.id,
      result.user.email,
      result.user.name,
      result.user.role,
      result.user.tenantId,
      null,
      null,
      false,
      new Date(),
    );
    const tokens = await this.tokenIssuer.issueFor(owner);

    return {
      tenant: result.tenant,
      user: owner,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}

/** Config específica por vertical, gravada em `tenant.settings`. Ver PRD 2.1. */
function buildSettings(
  input: OnboardingDto,
): Record<string, unknown> | null {
  switch (input.establishmentType) {
    case EstablishmentType.HAIR_SALON:
      return { offersChemicalServices: input.offersChemicalServices };
    case EstablishmentType.TATTOO_STUDIO:
      return {
        consentFormRequired: input.consentFormRequired,
        requiresDeposit: input.requiresDeposit,
      };
    default:
      return null;
  }
}
