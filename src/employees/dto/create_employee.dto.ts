import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CreateContactEmergencyDto } from './create_contact_emergency.dto';
import { CreateLicenseDto } from './create_license.dto';
import { CreateExamenPreocupacionalDto } from './create_examen.dto';

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
  estado: string = 'DISPONIBLE';

  @IsNotEmpty()
  @IsNumber()
  numero_legajo: number;

  @IsNotEmpty()
  @IsString()
  @Length(11, 20, { message: 'El CUIL debe tener entre 11 y 20 caracteres' })
  cuil: string;

  @IsNotEmpty()
  @IsString()
  @Length(22, 22, { message: 'El CBU debe tener exactamente 22 dígitos' })
  cbu: string;
}

export class CreateFullEmployeeDto extends CreateEmployeeDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContactEmergencyDto)
  emergencyContacts?: CreateContactEmergencyDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLicenseDto)
  licencia?: CreateLicenseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateExamenPreocupacionalDto)
  examenPreocupacional?: CreateExamenPreocupacionalDto;
}
