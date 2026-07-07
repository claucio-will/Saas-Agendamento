import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthModule } from './modules/health/health.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    // Validação fail-fast das variáveis de ambiente no boot. Ver PRD 8.2 §10.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Logs estruturados (JSON) com trace_id por requisição. Ver PRD 3.5.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          const id =
            (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    TenantModule,
    CatalogModule,
    SchedulingModule,
  ],
})
export class AppModule {}
