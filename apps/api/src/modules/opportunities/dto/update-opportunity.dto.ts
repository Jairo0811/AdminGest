import { PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateOpportunityDto } from './create-opportunity.dto';

export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;
}
