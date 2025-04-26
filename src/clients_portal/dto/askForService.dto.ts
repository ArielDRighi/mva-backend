import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

enum BathroomQuantity {
  CHICO = '1-5',
  MEDIANO = '5-10',
  GRANDE = '+10',
}

export class AskForServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  nombrePersona: string;

  @IsOptional()
  @IsString()
  rolPersona: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Debe proporcionar un email valido' })
  email: string;

  @IsNotEmpty({ message: 'El telefono es requerido' })
  @IsString()
  telefono: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
  nombreEmpresa: string;

  @IsString()
  @IsOptional()
  cuit: string;

  @IsString()
  @IsOptional()
  rubroEmpresa: string;

  @IsNotEmpty({ message: 'La zona / direccion es requerida' })
  @IsString()
  zonaDireccion: string;

  @IsOptional()
  @IsEnum(BathroomQuantity, { message: 'La cantidad debe ser 1-5, 5-10 o +10' })
  cantidadBaños: BathroomQuantity;

  @IsOptional()
  @IsString()
  tipoEvento: string;

  @IsOptional()
  @IsString()
  duracionAlquiler: string;

  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  startDate?: string;

  @IsOptional()
  @IsString()
  comentarios: string;
}
