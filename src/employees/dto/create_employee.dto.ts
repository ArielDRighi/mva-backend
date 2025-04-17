import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @Length(2, 100, {
    message: 'El apellido debe tener entre 2 y 100 caracteres',
  })
  apellido: string;

  @IsString()
  @IsNotEmpty({ message: 'El documento es requerido' })
  @Length(5, 20, { message: 'El documento debe tener entre 5 y 20 caracteres' })
  documento: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  telefono: string;

  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @Transform(({ value }): string => {
    if (typeof value === 'string') {
      // Convertir cualquier formato de fecha válido a ISO
      return new Date(value).toISOString();
    }
    return value as string;
  })
  @IsOptional()
  fecha_nacimiento?: string; // Nota: cambiado a string

  @Transform(({ value }): string => {
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    return value as string;
  })
  @IsNotEmpty({ message: 'La fecha de contratación es requerida' })
  fecha_contratacion: string; // Nota: cambiado a string

  @IsString()
  @IsNotEmpty({ message: 'El cargo es requerido' })
  cargo: string;

  @IsString()
  @IsOptional()
  estado: string = 'ACTIVO';
}
