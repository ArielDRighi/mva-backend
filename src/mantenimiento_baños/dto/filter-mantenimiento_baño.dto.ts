import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class FilterMantenimientoBañoDto {
  @IsOptional()
  @IsNumber()
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
