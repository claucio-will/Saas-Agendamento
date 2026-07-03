import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { initSentry } from './config/sentry';

async function bootstrap(): Promise<void> {
  // Monitoramento de erros (ativa apenas se SENTRY_DSN estiver definido).
  initSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger estruturado (pino) como logger global do Nest.
  app.useLogger(app.get(Logger));

  // Todas as rotas sob /api.
  app.setGlobalPrefix('api');

  // CORS restrito à origem do frontend. Ver PRD 3.4.
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Necessário para onModuleDestroy do Prisma (fecha conexões no shutdown).
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}

void bootstrap();
