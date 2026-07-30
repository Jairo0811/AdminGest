import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCatalogItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['PRODUCT', 'SERVICE'])
  type!: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;
}

