import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
  StoreRefreshTokenData,
} from '../domain/refresh-token.repository';

/** Adapter Prisma do RefreshTokenRepository. */
@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async store(data: StoreRefreshTokenData): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
    };
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
