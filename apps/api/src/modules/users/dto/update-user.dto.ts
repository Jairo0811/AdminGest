import { IsIn, IsOptional } from 'class-validator';
import { USER_ROLES } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: (typeof USER_ROLES)[number];

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  status?: string;
}

