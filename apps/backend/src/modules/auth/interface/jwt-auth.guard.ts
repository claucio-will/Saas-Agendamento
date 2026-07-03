import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige um access token válido (Bearer). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
