import { IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(80, 200, { message: 'El token de recuperación no es válido.' })
  token!: string;

  @IsString()
  @Length(10, 72, { message: 'La contraseña debe tener entre 10 y 72 caracteres.' })
  @Matches(/[a-z]/, { message: 'La contraseña debe incluir una letra minúscula.' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe incluir una letra mayúscula.' })
  @Matches(/[0-9]/, { message: 'La contraseña debe incluir un número.' })
  password!: string;
}
