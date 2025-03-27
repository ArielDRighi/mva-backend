import {
  IsEmail,
  IsOptional,
  Length,
  Matches,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Role } from '../../roles/enums/role.enum';

export class UpdateUserDto {
  @IsOptional()
  empleadoId?: number;

  @IsOptional()
  @Length(3, 50, {
    message: 'El nombre de usuario debe tener entre 3 y 50 caracteres',
  })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos',
  })
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  email?: string;

  @IsOptional()
  @Length(6, 30, {
    message: 'La contraseña debe tener entre 6 y 30 caracteres',
  })
  password?: string;

  @IsOptional()
  @Matches(/(ACTIVO|INACTIVO)/, {
    message: 'El estado debe ser ACTIVO o INACTIVO',
  })
  estado?: string;

  @IsOptional()
  @IsEnum(Role, { each: true })
  @IsArray()
  roles?: Role[];
}
