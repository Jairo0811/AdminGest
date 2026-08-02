import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const OPPORTUNITY_STATUSES = ['OPEN', 'WON', 'LOST'] as const;

export class CreateOpportunityDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  pipelineStageId!: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedValue!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsIn(OPPORTUNITY_STATUSES)
  status?: (typeof OPPORTUNITY_STATUSES)[number];
}
