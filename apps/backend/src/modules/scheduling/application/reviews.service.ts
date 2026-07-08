import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UserRole,
  type CreateReviewDto,
  type ReviewResponseDto,
  type ReviewsResponseDto,
} from '@repo/shared';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../auth/domain/user.repository';
import type { AuthUserPrincipal } from '../../auth/interface/current-user.decorator';
import {
  SchedulingRepository,
  type ReviewRow,
  type TenantSchedulingInfo,
} from '../infrastructure/scheduling.repository';

/** Avaliações públicas de um estabelecimento. Ver PRD 2.11. */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly repo: SchedulingRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async listBySlug(slug: string): Promise<ReviewsResponseDto> {
    const tenant = await this.resolveTenant(slug);
    const [summary, items] = await Promise.all([
      this.repo.getRatingSummary(tenant.id),
      this.repo.listReviews(tenant.id),
    ]);
    return {
      average: Math.round(summary.average * 10) / 10,
      count: summary.count,
      items: items.map((r) => this.toDto(r)),
    };
  }

  async create(
    slug: string,
    principal: AuthUserPrincipal,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    if (principal.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Apenas clientes podem avaliar.');
    }
    const tenant = await this.resolveTenant(slug);

    const eligible = await this.repo.hasCompletedAppointment(
      tenant.id,
      principal.userId,
    );
    if (!eligible) {
      throw new ForbiddenException(
        'Você só pode avaliar após um atendimento concluído aqui.',
      );
    }

    const user = await this.users.findById(principal.userId);
    if (!user) throw new BadRequestException('Usuário não encontrado.');

    const row = await this.repo.upsertReview(tenant.id, {
      customerId: principal.userId,
      customerName: user.name,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
    return this.toDto(row);
  }

  private async resolveTenant(slug: string): Promise<TenantSchedulingInfo> {
    const tenant = await this.repo.getTenantBySlug(slug);
    if (
      !tenant ||
      tenant.status === 'CANCELLED' ||
      tenant.status === 'SUSPENDED'
    ) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    return tenant;
  }

  private toDto(r: ReviewRow): ReviewResponseDto {
    return {
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
