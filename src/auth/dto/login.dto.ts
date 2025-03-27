import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  username: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
