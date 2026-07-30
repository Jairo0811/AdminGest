import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(2, 120)
  companyName!: string;

  @IsOptional()
  @IsString()
  @Length(9, 20)
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

