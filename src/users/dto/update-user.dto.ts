import { IsEmail, IsOptional, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'ID del empleado asociado',
    example: 1001,
  })
  @IsOptional()
  empleadoId?: number;

  @ApiPropertyOptional({
    description: 'Nombre de usuario único',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @Length(3, 50, {
    message: 'El nombre de usuario debe tener entre 3 y 50 caracteres',
  })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico único del usuario',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Contraseña del usuario',
    example: 'newpassword123',
    minLength: 6,
    maxLength: 30,
  })
  @IsOptional()
  @Length(6, 30, {
    message: 'La contraseña debe tener entre 6 y 30 caracteres',
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'Estado del usuario',
    example: 'ACTIVO',
    enum: ['ACTIVO', 'INACTIVO'],
  })
  @IsOptional()
  @Matches(/(ACTIVO|INACTIVO)/, {
    message: 'El estado debe ser ACTIVO o INACTIVO',
  })
  estado?: string;
}
