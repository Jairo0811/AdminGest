import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { USER_ROLES } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  lastName?: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: (typeof USER_ROLES)[number];

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  status?: string;
}
