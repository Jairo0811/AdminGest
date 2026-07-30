import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCatalogItemDto } from './create-catalog-item.dto';

export class UpdateCatalogItemDto extends PartialType(CreateCatalogItemDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

