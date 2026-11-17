import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDominicanTaxId } from '../../../common/validation/is-dominican-tax-id.decorator';

export class CreateContactDto {
  @IsString()
  @Length(2, 60)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class CreateCustomerDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @IsDominicanTaxId()
  taxId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateContactDto)
  primaryContact?: CreateContactDto;
}
