import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { API_VERSION } from '../../version';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  @Public()
  @ApiOperation({ summary: 'Comprueba el estado de la API' })
  getHealth(): { status: string; service: string; version: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'AdminGest API',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    };
  }
  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Comprueba que la API y la base de datos respondan' })
  async readiness() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException('Base de datos no disponible.');
    }
  }
}
