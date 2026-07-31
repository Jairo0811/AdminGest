import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { IsDominicanTaxId } from '../../../common/validation/is-dominican-tax-id.decorator';

export class RegisterDto {
  @IsString()
  @Length(2, 120)
  companyName!: string;

  @IsOptional()
  @IsString()
  @IsDominicanTaxId()
  taxId?: string;

  @IsString()
  @Length(2, 60)
  firstName!: string;

  @IsString()
  @Length(2, 60)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;
}
