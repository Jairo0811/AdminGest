import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * The API starts even if the database is momentarily unreachable (a paused Azure SQL
   * Serverless database, a firewall change, a slow cold start). Prisma reconnects on the
   * next query; meanwhile /api/health answers (liveness) and /api/health/ready reports
   * 503 (readiness), and requests that need the database receive DATABASE_UNAVAILABLE.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(
        `No fue posible conectar con la base de datos al iniciar; se reintentará en la próxima consulta (${
          error instanceof Error ? error.name : 'error'
        }).`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
