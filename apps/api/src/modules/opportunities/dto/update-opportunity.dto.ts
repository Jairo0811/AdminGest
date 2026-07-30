import { PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateOpportunityDto } from './create-opportunity.dto';

export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {
  @IsOptional()
  @IsIn(['OPEN', 'WON', 'LOST'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;
}
