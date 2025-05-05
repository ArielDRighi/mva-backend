import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
  IsEnum,
  Matches,
} from 'class-validator';
import { TipoCabina } from '../entities/vehicle.entity';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  placa?: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900, { message: 'El año debe ser válido' })
  anio?: number;

  @IsString()
  @IsOptional()
  numeroInterno?: string;

  @IsEnum(TipoCabina, { message: 'El tipo de cabina debe ser simple o doble' })
  @IsOptional()
  tipoCabina?: TipoCabina;

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
  esExterno?: boolean;

  @IsString()
  @IsOptional()
  estado?: string;
}
