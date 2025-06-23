import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  nombre?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100, {
    message: 'El apellido debe tener entre 2 y 100 caracteres',
  })
  apellido?: string;

  @IsString()
  @IsOptional()
  @Length(5, 20, { message: 'El documento debe tener entre 5 y 20 caracteres' })
  documento?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsOptional()
  email?: string;

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
  fecha_nacimiento?: string; // Cambiado a string

  @Transform(({ value }): string => {
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    return value as string;
  })
  @IsOptional()
  fecha_contratacion?: string; // Cambiado a string

  @IsString()
  @IsOptional()
  cargo?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsNumber()
  @IsOptional()
  numero_legajo?: number;

  @IsString()
  @IsOptional()
  @Length(11, 20, { message: 'El CUIL debe tener entre 11 y 20 caracteres' })
  cuil?: string;

  @IsOptional()
  @IsString()
  @Length(22, 22, { message: 'El CBU debe tener exactamente 22 dígitos' })
  cbu?: string;

  @IsOptional()
  @IsNumber()
  diasVacacionesRestantes?: number;

  @IsOptional()
  @IsNumber()
  diasVacacionesUsados?: number;
}
