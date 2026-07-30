import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Comprueba el estado de la API' })
  getHealth(): { status: string; service: string; version: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'AdminGest API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

