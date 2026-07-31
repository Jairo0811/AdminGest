import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../common/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NavigationService } from './navigation.service';

@ApiTags('Navigation')
@ApiBearerAuth()
@Controller('navigation')
export class NavigationController {
  constructor(private readonly service: NavigationService) {}

  @Get('search')
  @ApiQuery({ name: 'q', required: true, minLength: 2 })
  search(@CurrentUser() user: AuthUser, @Query('q') query = '') {
    return this.service.search(user.companyId, query);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: AuthUser) {
    return this.service.notifications(user.companyId);
  }
}
