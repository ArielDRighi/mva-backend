import { IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateToiletMaintenanceDto {
  @IsDateString()
  fecha_mantenimiento: Date;

  @IsString()
  tipo_mantenimiento: string;

  @IsString()
  descripcion: string;

  @IsString()
  tecnico_responsable: string;

  @IsNumber()
  costo: number;

  @IsNumber()
  baño_id: number;
}
