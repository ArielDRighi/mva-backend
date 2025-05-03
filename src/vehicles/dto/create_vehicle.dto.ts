import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsBoolean,
  IsEnum,
  Matches,
} from 'class-validator';
import { TipoCabina } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'La placa del vehículo es requerida' })
  placa: string;

  @IsString()
  @IsNotEmpty({ message: 'La marca del vehículo es requerida' })
  marca: string;

  @IsString()
  @IsNotEmpty({ message: 'El modelo del vehículo es requerido' })
  modelo: string;

  @IsNumber()
  @Min(1900, { message: 'El año debe ser válido' })
  anio: number;

  @IsString()
  @IsOptional()
  numeroInterno?: string;

  @IsEnum(TipoCabina, { message: 'El tipo de cabina debe ser simple o doble' })
  @IsOptional()
  tipoCabina?: TipoCabina = TipoCabina.SIMPLE;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  fechaVencimientoVTV?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  fechaVencimientoSeguro?: string;

  @IsBoolean()
  @IsOptional()
  esExterno?: boolean = false;

  @IsString()
  estado: string = 'ACTIVO';
}
