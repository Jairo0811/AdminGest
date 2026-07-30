import { PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreateOpportunityDto } from './create-opportunity.dto';

export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {
  @IsOptional()
  @IsIn(['OPEN', 'WON', 'LOST'])
  status?: string;

  @IsOptional()
  @IsString()
  lostReason?: string;
}

