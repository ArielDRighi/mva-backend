import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'ID del empleado asociado',
    example: 1001,
  })
  @IsOptional()
  empleadoId?: number;

  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @Length(3, 50, {
    message: 'El nombre de usuario debe tener entre 3 y 50 caracteres',
  })
  @Matches(/^[a-zA-Z0-9._\- ]+$/, {
    // Nótese el espacio añadido en la expresión regular
    message:
      'El nombre de usuario solo puede contener letras, números, puntos, guiones, guiones bajos y espacios',
  })
  username: string;

  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    minLength: 6,
    maxLength: 30,
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @Length(6, 30, {
    message: 'La contraseña debe tener entre 6 y 30 caracteres',
  })
  password: string;
}
