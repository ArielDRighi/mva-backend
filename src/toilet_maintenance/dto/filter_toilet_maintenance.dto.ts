import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterToiletMaintenanceDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number) // Convierte automáticamente el string a número
  baño_id?: number;

  @IsOptional()
  @IsString()
  tipo_mantenimiento?: string;

  @IsOptional()
  @IsString()
  tecnico_responsable?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
