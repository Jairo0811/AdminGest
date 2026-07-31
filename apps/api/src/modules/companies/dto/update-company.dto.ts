import { IsEmail, IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { IsDominicanTaxId } from '../../../common/validation/is-dominican-tax-id.decorator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

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
  address?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
