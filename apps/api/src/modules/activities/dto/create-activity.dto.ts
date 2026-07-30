import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const ACTIVITY_TYPES = [
  'CALL',
  'EMAIL',
  'MEETING',
  'VISIT',
  'TASK',
  'FOLLOW_UP',
] as const;

export class CreateActivityDto {
  @IsIn(ACTIVITY_TYPES)
  type!: (typeof ACTIVITY_TYPES)[number];

  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

