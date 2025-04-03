import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class UpdateToiletMaintenanceDto {
  @IsOptional()
  @IsDateString()
  fecha_mantenimiento?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tipo_mantenimiento?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tecnico_responsable?: string;

  @IsOptional()
  @IsNumber()
  costo?: number;

  @IsOptional()
  @IsNumber()
  baño_id?: number;
}
