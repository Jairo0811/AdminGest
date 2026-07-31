import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Introduce un correo electrónico válido.' })
  @MaxLength(254)
  email!: string;
}
