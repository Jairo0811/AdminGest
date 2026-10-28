import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../common/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@Roles('SUPER_ADMIN', 'ADMIN')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Consulta el plan, estado y consumo del tenant actual' })
  current(@CurrentUser() user: AuthUser) {
    return this.subscriptions.getCurrent(user.companyId);
  }
}
