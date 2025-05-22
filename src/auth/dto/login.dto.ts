import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El email del usuario es requerido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @IsString({ message: 'El correo electrónico debe ser una cadena' })
  email: string;
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  @IsString({ message: 'La contraseña actual debe ser una cadena' })
  oldPassword: string;

  @IsNotEmpty({ message: 'La nueva contraseña es requerida' }) // ✅ Mensaje corregido
  @IsString({ message: 'La nueva contraseña debe ser una cadena' })
  @Matches(/[a-z]/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  @Matches(/\d/, {
    message: 'La contraseña debe contener al menos un número',
  })
  @Matches(/^.{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  newPassword: string;
}
