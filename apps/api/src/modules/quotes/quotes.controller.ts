import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../common/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Get('verify/:publicCode')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verifica públicamente la autenticidad de una cotización' })
  verify(@Param('publicCode') publicCode: string) {
    return this.service.findPublicVerification(publicCode);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.service.findAll(user.companyId, status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.companyId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuoteDto) {
    return this.service.create(user.companyId, user.id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteStatusDto,
  ) {
    return this.service.updateStatus(user.companyId, user.id, id, dto.status);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.companyId, user.id, id);
  }
}
