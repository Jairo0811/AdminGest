import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@ApiHeader({
  name: 'x-company-id',
  description: 'Identificador temporal de empresa hasta integrar JWT multiempresa.',
  required: true,
})
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Headers('x-company-id') companyId: string) {
    return this.leadsService.findAll(companyId);
  }

  @Post()
  create(
    @Headers('x-company-id') companyId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(companyId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body('status') status: LeadStatus,
  ) {
    return this.leadsService.updateStatus(companyId, id, status);
  }
}
