import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../common/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.companyId);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'PROJECT_MANAGER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDocumentDto) {
    return this.service.create(user.companyId, user.id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'PROJECT_MANAGER')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.companyId, id);
  }
}
