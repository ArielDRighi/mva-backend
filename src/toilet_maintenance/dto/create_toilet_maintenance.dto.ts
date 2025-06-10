import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateToiletMaintenanceDto {
  @IsDateString()
  fecha_mantenimiento: Date;

  @IsString()
  tipo_mantenimiento: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  empleado_id: number;

  @IsOptional()
  @IsNumber()
  costo?: number;

  @IsNumber()
  baño_id: number;
}
