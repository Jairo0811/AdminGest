import { IsEmail, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 60)
  firstName!: string;

  @IsString()
  @Length(2, 60)
  lastName!: string;

  @IsEmail()
  email!: string;
}
