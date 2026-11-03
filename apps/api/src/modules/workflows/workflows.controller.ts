import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../common/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('workflows')
@Roles('ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER')
export class WorkflowsController {
  constructor(private readonly service: WorkflowsService) {}

  @Get('rules')
  rules(@CurrentUser() user: AuthUser) { return this.service.rules(user.companyId); }

  @Patch('rules/:type')
  @Roles('ADMIN', 'SUPER_ADMIN')
  rule(@CurrentUser() user: AuthUser, @Param('type') type: string, @Body() dto: UpdateRuleDto) {
    return this.service.updateRule(user.companyId, type, dto.enabled);
  }

  @Get('templates')
  templates(@CurrentUser() user: AuthUser) { return this.service.templates(user.companyId); }

  @Post('templates')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(user.companyId, dto);
  }

  @Delete('templates/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteTemplate(user.companyId, id);
  }

  @Post('templates/:id/apply/:projectId')
  apply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('projectId') projectId: string) {
    return this.service.applyTemplate(user.companyId, id, projectId);
  }
}
