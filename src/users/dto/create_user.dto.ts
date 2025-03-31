import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Role } from '../../roles/enums/role.enum';

export class CreateUserDto {
  @IsOptional()
  empleadoId?: number;

  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @Length(3, 50, {
    message: 'El nombre de usuario debe tener entre 3 y 50 caracteres',
  })
  @Matches(/^[a-zA-Z0-9._\- ]+$/, {
    message:
      'El nombre de usuario solo puede contener letras, números, puntos, guiones, guiones bajos y espacios',
  })
  nombre: string;

  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @Length(6, 30, {
    message: 'La contraseña debe tener entre 6 y 30 caracteres',
  })
  password: string;

  @IsOptional()
  @IsEnum(Role, { each: true })
  @IsArray()
  roles?: Role[];
}
