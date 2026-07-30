import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { CompanyService } from './company.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Empresa y usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.company.get(user.companyId);
  }

  @Patch()
  @Roles('ADMIN')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateCompanyDto) {
    return this.company.update(user, dto);
  }

  @Get('users')
  @Roles('ADMIN')
  listUsers(@CurrentUser() user: AuthUser) {
    return this.company.listUsers(user.companyId);
  }

  @Post('users')
  @Roles('ADMIN')
  createUser(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.company.createUser(user, dto);
  }

  @Patch('users/:id')
  @Roles('ADMIN')
  updateUser(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.company.updateUser(user, id, dto);
  }
}
