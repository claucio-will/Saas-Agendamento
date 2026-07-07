import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type PlatformOwner,
  type UserRepository,
} from '../../auth/domain/user.repository';

/** Lista os donos de estabelecimento (clientes da plataforma) para o Super Admin. */
@Injectable()
export class ListPlatformOwnersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  execute(): Promise<PlatformOwner[]> {
    return this.users.findOwners();
  }
}
