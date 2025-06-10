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
  @IsNumber()
  empleado_id?: number;

  @IsOptional()
  @IsNumber()
  costo?: number;

  @IsOptional()
  @IsNumber()
  baño_id?: number;
}
