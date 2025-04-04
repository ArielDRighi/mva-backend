import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

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
  @IsNotEmpty()
  baño_id: number;
}
