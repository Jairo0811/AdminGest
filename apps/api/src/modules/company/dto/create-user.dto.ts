import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  password!: string;

  @IsIn(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'PROJECT_MANAGER', 'VIEWER'])
  role!: string;
}

export class UpdateUserDto {
  @IsIn(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'PROJECT_MANAGER', 'VIEWER'])
  role!: string;

  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  status!: string;
}
