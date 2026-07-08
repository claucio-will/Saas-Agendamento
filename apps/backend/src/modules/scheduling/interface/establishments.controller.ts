import { Controller, Get } from '@nestjs/common';
import type { PublicEstablishmentDto } from '@repo/shared';
import { PublicProfileService } from '../application/public-profile.service';

/** Descoberta pública de estabelecimentos (home). Sem login. Ver PRD 2.7. */
@Controller('establishments')
export class EstablishmentsController {
  constructor(private readonly profile: PublicProfileService) {}

  @Get()
  list(): Promise<PublicEstablishmentDto[]> {
    return this.profile.listEstablishments();
  }
}
