import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const MONEY = { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false } as const;

export class CreateQuoteItemDto {
  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @IsString()
  @Length(1, 500)
  description!: string;

  @IsNumber(MONEY)
  @Min(0.01)
  @Max(1_000_000)
  quantity!: number;

  @IsNumber(MONEY)
  @Min(0)
  @Max(1_000_000_000)
  unitPrice!: number;

  @IsOptional()
  @IsNumber(MONEY)
  @Min(0)
  @Max(100)
  taxRate?: number;
}

export class CreateQuoteDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsNumber(MONEY)
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items!: CreateQuoteItemDto[];
}
