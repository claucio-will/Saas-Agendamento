import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createAppointmentSchema,
  createReviewSchema,
  UserRole,
  type AppointmentResponseDto,
  type AvailabilityResponseDto,
  type CreateAppointmentDto,
  type CreateReviewDto,
  type PublicProfileResponseDto,
  type ReviewResponseDto,
  type ReviewsResponseDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CurrentUser,
  type AuthUserPrincipal,
} from '../../auth/interface/current-user.decorator';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/interface/optional-jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { AvailabilityService } from '../application/availability.service';
import { BookingService } from '../application/booking.service';
import { PublicProfileService } from '../application/public-profile.service';
import { ReviewsService } from '../application/reviews.service';

/**
 * Rotas públicas do estabelecimento (por slug): ver disponibilidade e agendar.
 * Sem login obrigatório (login opcional). Ver PRD 2.7/2.8.
 */
@Controller('public/:slug')
export class PublicSchedulingController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly booking: BookingService,
    private readonly profile: PublicProfileService,
    private readonly reviews: ReviewsService,
  ) {}

  @Get()
  getProfile(@Param('slug') slug: string): Promise<PublicProfileResponseDto> {
    return this.profile.getBySlug(slug);
  }

  @Get('availability')
  getAvailability(
    @Param('slug') slug: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('professionalId') professionalId?: string,
  ): Promise<AvailabilityResponseDto> {
    if (!serviceId || !date) {
      throw new BadRequestException('Informe serviceId e date (YYYY-MM-DD).');
    }
    return this.availability.getBySlug(slug, serviceId, date, professionalId);
  }

  @Post('appointments')
  @HttpCode(201)
  @UseGuards(OptionalJwtAuthGuard)
  book(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(createAppointmentSchema))
    dto: CreateAppointmentDto,
    @CurrentUser() principal: AuthUserPrincipal | null,
  ): Promise<AppointmentResponseDto> {
    return this.booking.book(slug, dto, principal ?? null);
  }

  @Get('reviews')
  getReviews(@Param('slug') slug: string): Promise<ReviewsResponseDto> {
    return this.reviews.listBySlug(slug);
  }

  /** Avaliar exige cliente logado e um atendimento concluído aqui. */
  @Post('reviews')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  review(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewDto,
    @CurrentUser() principal: AuthUserPrincipal,
  ): Promise<ReviewResponseDto> {
    return this.reviews.create(slug, principal, dto);
  }
}
