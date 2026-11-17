import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsDominicanTaxId } from '../../../common/validation/is-dominican-tax-id.decorator';

/** Empty strings in optional fields mean "clear the value". */
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : value;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateCompanyDto {
  // Required columns: may be omitted, but never cleared.
  @ValidateIf((dto: UpdateCompanyDto) => dto.name !== undefined)
  @Transform(trim)
  @IsString()
  @Length(2, 150)
  name?: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @IsDominicanTaxId()
  taxId?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  logoUrl?: string | null;

  @ValidateIf((dto: UpdateCompanyDto) => dto.currency !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'La moneda debe ser un código ISO 4217 de 3 letras.' })
  currency?: string;

  @ValidateIf((dto: UpdateCompanyDto) => dto.timezone !== undefined)
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
