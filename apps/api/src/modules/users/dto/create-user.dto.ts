import { IsEmail, IsIn, IsString, Length, MinLength } from 'class-validator';

export const USER_ROLES = [
  'ADMIN',
  'SALES_MANAGER',
  'SALES_REP',
  'PROJECT_MANAGER',
  'VIEWER',
] as const;

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsString()
  @Length(2, 60)
  firstName!: string;

  @IsString()
  @Length(2, 60)
  lastName!: string;

  @IsIn(USER_ROLES)
  role!: (typeof USER_ROLES)[number];
}

