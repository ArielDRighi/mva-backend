import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMaintenanceDto {
  @IsNotEmpty({ message: 'El ID del vehículo es requerido' })
  @IsNumber()
  vehiculoId: number;

  @IsDate()
  @Type(() => Date)
  fechaMantenimiento: Date;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de mantenimiento es requerido' })
  tipoMantenimiento: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(0, { message: 'El costo debe ser mayor o igual a cero' })
  costo: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  proximoMantenimiento?: Date;
}
